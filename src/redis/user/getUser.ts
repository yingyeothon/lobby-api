import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import User from "../../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import keys from "../keys";
import redisGet from "@yingyeothon/naive-redis/lib/get";

const logger = getLogger("getUser", __filename);

export default async function getUser(
  redisConnection: RedisConnection,
  connectionId: string
): Promise<User | null> {
  const serializedUser = await redisGet(
    redisConnection,
    keys.user(connectionId)
  );
  if (serializedUser === null) {
    logger.debug({ connectionId }, `Already deleted`);
    return null;
  }

  return JSON.parse(serializedUser) as User;
}
