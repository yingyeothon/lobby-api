import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import { APIGatewayProxyHandler } from "aws-lambda";
import logger from "./logger";
import deregisterFromPool from "./match/deregisterFromPool";
import responses from "./model/responses";
import deleteUser from "./redis/user/deleteUser";
import getUser from "./redis/user/getUser";
import useRedis from "./redis/useRedis";

export const handle: APIGatewayProxyHandler = async event => {
  const { connectionId } = event.requestContext;
  if (connectionId === undefined) {
    logger.debug(`No connectionId`);
    return responses.BadRequest;
  }

  logger.info(`Start to clear user context`, connectionId);

  await useRedis(async redisConnection => {
    const user = await getUser(redisConnection, connectionId);
    if (user === null) {
      return;
    }
    try {
      const deleted = await Promise.all([
        deregisterFromPool({
          user,
          srem: (key, value) => redisSrem(redisConnection, key, value),
          del: key => redisDel(redisConnection, key)
        }),
        deleteUser(redisConnection, connectionId)
      ]);
      logger.info(`Clear user`, user, `redisResponse`, deleted);
    } catch (error) {
      logger.error(`User`, connectionId, `redisError`, error);
    }
  });
  return responses.OK;
};
