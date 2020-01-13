import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import IUser from "../../model/user";
import keys from "../keys";

export default async function setUser(
  redisConnection: IRedisConnection,
  user: IUser
) {
  return redisSet(
    redisConnection,
    keys.user(user.connectionId),
    JSON.stringify(user)
  );
}
