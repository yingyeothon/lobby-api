import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import IUser from "../model/user";
import redisKeys from "../redis/keys";
import logger from "./logger";

export default async function registerToPool(
  user: IUser,
  redisConnection: IRedisConnection,
  applicationId: string
) {
  if (!user.applications.includes(applicationId)) {
    logger.debug(`Invalid application id for matching`, user, applicationId);
    return false;
  }

  const { connectionId } = user;
  const added = await Promise.all([
    redisSadd(
      redisConnection,
      redisKeys.matchingPool(applicationId),
      connectionId
    ),
    redisSet(
      redisConnection,
      redisKeys.matchingTime(applicationId, connectionId),
      Date.now().toString()
    )
  ]);
  logger.info(`Add to matching pool`, user, applicationId, added);
  return true;
}
