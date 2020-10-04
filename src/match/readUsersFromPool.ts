import User from "../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import redisKeys from "../redis/keys";

const logger = getLogger("readUsersFromPool", __filename);

export interface ReadEnvironment {
  applicationId: string;
  smembers: (key: string) => Promise<string[]>;
  srem: (key: string, ...values: string[]) => Promise<number>;
  getUser: (connectionId: string) => Promise<User | null>;
}

export default async function readUsersFromPool({
  applicationId,
  smembers,
  srem,
  getUser,
}: ReadEnvironment): Promise<User[]> {
  logger.debug({ applicationId }, `Read users from pool`);
  const connectionIds = await smembers(redisKeys.matchingPool(applicationId));
  if (connectionIds.length === 0) {
    return [];
  }

  logger.debug({ connectionIds }, `Read users from pool with connectionIds`);
  const users = (
    await Promise.all(
      connectionIds.map((connectionId) => getUser(connectionId))
    )
  )
    .filter(Boolean)
    .map((u) => u!);

  // TODO Delete members who already deleted their context.
  const lostConnectionIds = connectionIds.filter((connectionId) =>
    users.every((u) => u.connectionId !== connectionId)
  );
  if (lostConnectionIds.length > 0) {
    logger.info({ lostConnectionIds }, `Drop lost connectionIds`);
    await srem(redisKeys.matchingPool(applicationId), ...lostConnectionIds);
  }

  logger.debug({ users }, `Users in pool`);
  return users;
}
