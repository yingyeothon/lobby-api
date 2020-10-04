import { APIGatewayProxyHandler } from "aws-lambda";
import deleteUser from "./redis/user/deleteUser";
import deregisterFromPool from "./match/deregisterFromPool";
import { getLogger } from "@yingyeothon/slack-logger";
import getUser from "./redis/user/getUser";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import responses from "./model/responses";
import useRedis from "./redis/useRedis";

const logger = getLogger("handle:disconnect", __filename);

export const handle: APIGatewayProxyHandler = async (event) => {
  const { connectionId } = event.requestContext;
  if (connectionId === undefined) {
    logger.debug({}, `No connectionId`);
    return responses.BadRequest;
  }

  logger.info(`Start to clear user context`, connectionId);

  await useRedis(async (redisConnection) => {
    const user = await getUser(redisConnection, connectionId);
    if (user === null) {
      return;
    }
    try {
      const deleted = await Promise.all([
        deregisterFromPool({
          user,
          srem: (key, value) => redisSrem(redisConnection, key, value),
          del: (key) => redisDel(redisConnection, key),
        }),
        deleteUser(redisConnection, connectionId),
      ]);
      logger.info({ user, deleted }, `Delete user`);
    } catch (error) {
      logger.error({ connectionId, user, error }, `Delete user error`);
    }
  });

  await logger.flushSlack();
  return responses.OK;
};
