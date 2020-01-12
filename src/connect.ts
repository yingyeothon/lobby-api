import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import { APIGatewayProxyHandler } from "aws-lambda";
import apps from "./data/applications";
import IAuthorization from "./model/authorization";
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

  const authorization = event.requestContext.authorizer as IAuthorization;
  if (!authorization) {
    logger.debug(`No authorization`);
    return responses.BadRequest;
  }
  logger.debug(`Authorization`, authorization);

  const { name, email, applications } = authorization;
  if (!name || !applications || applications.length === 0) {
    logger.debug(`Invalid authorization`, authorization);
    return responses.BadRequest;
  }

  const supportedAppIds = applications.filter(id =>
    apps.some(app => app.id === id)
  );
  if (supportedAppIds.length === 0) {
    logger.debug(`No supported applications`);
    return responses.BadRequest;
  }

  const user: IUser = {
    name,
    email,
    connectionId,
    applications: supportedAppIds
  };
  logger.info(`Setup a new user`, user);

  const redisConnection = redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });
  try {
    const result = await Promise.all<any>([
      redisSet(
        redisConnection,
        redisKeys.user(connectionId),
        JSON.stringify(user)
      ),
      ...supportedAppIds.map(appId =>
        redisSadd(redisConnection, redisKeys.chatingPool(appId), connectionId)
      )
    ]);
    logger.debug(`User`, user, `redisResponse`, result);
  } catch (error) {
    logger.error(`User`, user, `redisError`, error);
    return responses.BadRequest;
  } finally {
    redisConnection.socket.disconnect();
  }
  return responses.OK;
};
