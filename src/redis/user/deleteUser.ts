import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import keys from "../keys";

export default async function deleteUser(
  redisConnection: IRedisConnection,
  connectionId: string
) {
  return redisDel(redisConnection, keys.user(connectionId));
}
