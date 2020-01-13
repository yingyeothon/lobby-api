import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import IUser from "../../model/user";
import keys from "../keys";
import logger from "../logger";

export default async function getUser(
  redisConnection: IRedisConnection,
  connectionId: string
) {
  const serializedUser = await redisGet(
    redisConnection,
    keys.user(connectionId)
  );
  if (serializedUser === null) {
    logger.info(`Already deleted`, connectionId);
    return null;
  }

  return JSON.parse(serializedUser) as IUser;
}
