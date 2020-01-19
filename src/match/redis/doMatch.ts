import redisSadd from "@yingyeothon/naive-redis/lib/sadd";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import IUser from "../../model/user";
import registerToPool from "../registerToPool";
import getRedis from "./getRedis";
import requestMatch from "./requestMatch";

export default async function doMatch(user: IUser, applicationId: string) {
  const redisConnection = getRedis();
  await registerToPool({
    user,
    applicationId,
    sadd: (key, value) => redisSadd(redisConnection, key, value),
    set: (key, value) => redisSet(redisConnection, key, value)
  });
  return requestMatch(applicationId);
}
