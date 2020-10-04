import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import keys from "../keys";
import redisDel from "@yingyeothon/naive-redis/lib/del";

export default async function deleteUser(
  redisConnection: RedisConnection,
  connectionId: string
): Promise<number> {
  return redisDel(redisConnection, keys.user(connectionId));
}
