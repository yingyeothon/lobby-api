import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import { APIGatewayProxyHandler } from "aws-lambda";
import env from "./model/env";
import redisKeys from "./model/redisKeys";
import responses from "./model/responses";
import IUser from "./model/user";

export const handle: APIGatewayProxyHandler = async event => {
  const logger = new ConsoleLogger(`debug`);
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    logger.debug(`No connectionId`);
    return responses.BadRequest;
  }

  logger.info(`Clear user context`, connectionId);

  const redisConnection = redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });
  try {
    const serializedUser = await redisGet(
      redisConnection,
      redisKeys.user(connectionId)
    );
    if (!serializedUser) {
      logger.info(`Already deleted`, connectionId);
      return responses.OK;
    }

    const user = JSON.parse(serializedUser) as IUser;
    if (
      !user.connectionId ||
      !user.applications ||
      user.applications.length === 0
    ) {
      logger.info(`Delete invalid user context`, connectionId, user);
      await redisDel(redisConnection, redisKeys.user(connectionId));
      return responses.OK;
    }

    const deleted = await Promise.all([
      redisDel(redisConnection, redisKeys.user(connectionId)),
      ...user.applications.map(appId =>
        redisSrem(redisConnection, redisKeys.chatingPool(appId), connectionId)
      ),
      ...user.applications.map(appId =>
        redisSrem(redisConnection, redisKeys.matchingPool(appId), connectionId)
      )
    ]);
    logger.info(`Clear user`, user, `redisResponse`, deleted);
  } catch (error) {
    logger.error(`User`, connectionId, `redisError`, error);
    return responses.OK;
  } finally {
    redisConnection.socket.disconnect();
  }

  return responses.OK;
};
