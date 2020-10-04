import User from "../../model/User";
import getRedis from "./getRedis";
import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import registerToPool from "../registerToPool";
import requestMatch from "./requestMatch";

export default async function doMatch(
  user: User,
  applicationId: string
): Promise<boolean> {
  const redisConnection = getRedis();
  await registerToPool({
    user,
    applicationId,
    sadd: (key, value) => redisSadd(redisConnection, key, value),
    set: (key, value) => redisSet(redisConnection, key, value),
  });
  return requestMatch(applicationId);
}
