import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import IUser from "../model/user";
import redisKeys from "../redis/keys";

export default async function deregisterFromPool(
  user: IUser,
  redisConnection: IRedisConnection
) {
  const { connectionId } = user;
  return Promise.all([
    ...user.applications.map(appId =>
      redisSrem(redisConnection, redisKeys.matchingPool(appId), connectionId)
    ),
    ...user.applications.map(appId =>
      redisDel(redisConnection, redisKeys.matchingTime(appId, connectionId))
    )
  ]);
}
