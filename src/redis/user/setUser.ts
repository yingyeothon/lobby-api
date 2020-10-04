import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import User from "../../model/User";
import keys from "../keys";
import redisSet from "@yingyeothon/naive-redis/lib/set";

export default async function setUser(
  redisConnection: RedisConnection,
  user: User
): Promise<boolean> {
  return redisSet(
    redisConnection,
    keys.user(user.connectionId),
    JSON.stringify(user)
  );
}
