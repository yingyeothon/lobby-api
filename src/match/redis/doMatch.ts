import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import IUser from "../../model/user";
import registerToPool from "../registerToPool";
import getRedis from "./getRedis";
import logger from "./logger";
import requestMatch from "./requestMatch";

export default async function doMatch(user: IUser, applicationId: string) {
  const redisConnection = getRedis();
  const added = await registerToPool({
    user,
    applicationId,
    sadd: (key, value) => redisSadd(redisConnection, key, value),
    set: (key, value) => redisSet(redisConnection, key, value)
  });
  logger.info(`Add to matching pool`, user, applicationId, added);
  return requestMatch(applicationId);
}
