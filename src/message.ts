import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queuePush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import actorSend from "@yingyeothon/actor-system/lib/actor/send";
import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import apps from "./data/applications";
import IApplication from "./model/application";
import env from "./model/env";
import { LobbyRequest } from "./model/messages";
import redisKeys from "./model/redisKeys";
import responses from "./model/responses";
import IUser from "./model/user";
import dropConnection from "./support/dropConnection";
import postMessage from "./support/postMessage";

const redisConnection = redisConnect({
  host: env.redisHost,
  password: env.redisPassword
});
const logger = new ConsoleLogger(`debug`);
const actorSubsys = {
  logger,
  awaiter: {
    ...awaiterWait({ connection: redisConnection, logger }),
    ...awaiterResolve({ connection: redisConnection, logger })
  },
  queue: {
    ...queueSize({ connection: redisConnection, logger }),
    ...queuePush({ connection: redisConnection, logger }),
    ...queueFlush({ connection: redisConnection, logger })
  },
  lock: {
    ...lockAcquire({ connection: redisConnection, logger }),
    ...lockRelease({ connection: redisConnection, logger })
  }
};

class Match {
  private readonly app: IApplication;

  constructor(public readonly id: string) {
    this.app = apps.find(app => app.id === id)!;
  }

  public onMessages = async () => {
    const members = await redisSmembers(
      redisConnection,
      redisKeys.matchingPool(this.id)
    );
    while (members.length >= this.app.memberCount) {
      const matched = members.slice(0, this.app.memberCount);

      // Start a new Lambda to process game messages.
      const gameId = uuidv4();
      const invoked = await new Lambda({
        endpoint: env.isOffline ? `http://localhost:3000` : undefined
      })
        .invoke({
          FunctionName: this.app.functionName,
          InvocationType: "Event",
          Qualifier: "$LATEST",
          Payload: JSON.stringify({
            gameId,
            members: matched
          })
        })
        .promise();
      logger.info(`Start new game actor`, invoked);

      // Broadcast new game channel.
      const broadcast = await postMessage(matched, {
        type: "match",
        gameId,
        url: this.app.url
      });
      logger.info(`Notify a new game channel`, gameId, matched, broadcast);

      await redisSrem(
        redisConnection,
        redisKeys.matchingPool(this.id),
        ...matched
      );
    }
  };
}

export const handle: APIGatewayProxyHandler = async event => {
  if (!event.body) {
    return responses.BadRequest;
  }

  const connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    logger.debug(`No connectionId`);
    return responses.BadRequest;
  }

  const request = JSON.parse(event.body) as LobbyRequest;
  if (!request || !request.type) {
    logger.info(
      `Drop the connection that sent invalid message`,
      connectionId,
      request
    );
    await dropConnection(connectionId);
    return responses.BadRequest;
  }

  const serializedUser = await redisGet(
    redisConnection,
    redisKeys.user(connectionId)
  );
  if (!serializedUser) {
    logger.info(`Unregistered user`, connectionId);
    await dropConnection(connectionId);
    return responses.BadRequest;
  }

  const user = JSON.parse(serializedUser) as IUser;
  if (!user || !user.connectionId) {
    logger.info(`Invalid user context`, connectionId, user);
    await dropConnection(connectionId);
    return responses.BadRequest;
  }

  switch (request.type) {
    case "chat":
      // Broadcast this message to others.
      if (!request.application) {
        logger.debug(`No application for chat`);
        return responses.BadRequest;
      }

      const members = await redisSmembers(
        redisConnection,
        redisKeys.chatingPool(request.application)
      );
      await postMessage(members, { type: "chat", text: request.text });
      break;
    case "match":
      // Register this user to matching pool.
      if (!request.application) {
        logger.debug(`No application for chat`);
        return responses.BadRequest;
      }
      if (!user.applications.includes(request.application)) {
        logger.debug(`Invalid application id for matching`, user, request);
        return responses.BadRequest;
      }

      const poolKey = redisKeys.matchingPool(request.application);
      const added = await redisSadd(redisConnection, poolKey, connectionId);
      logger.info(`Add to matching pool`, user, request.application, added);

      // Try to matching.
      await actorSend(
        {
          _consume: "bulk",
          ...actorSubsys,
          ...new Match(request.application)
        },
        { item: {} }
      );
      break;
  }

  return {
    statusCode: 200,
    body: "OK"
  };
};
