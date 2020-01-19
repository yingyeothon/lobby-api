import IUser from "../model/user";
import redisKeys from "../redis/keys";
import logger from "./logger";

export interface IReadEnvironment {
  applicationId: string;
  smembers: (key: string) => Promise<string[]>;
  getUser: (connectionId: string) => Promise<IUser | null>;
}

export default async function readUsersFromPool({
  applicationId,
  smembers,
  getUser
}: IReadEnvironment): Promise<IUser[]> {
  logger.debug(`Read users from pool`, applicationId);
  const connectionIds = await smembers(redisKeys.matchingPool(applicationId));
  if (connectionIds.length === 0) {
    return [];
  }

  logger.debug(`Read users from pool with connectionIds`, connectionIds);
  const users = (
    await Promise.all(connectionIds.map(connectionId => getUser(connectionId)))
  )
    .filter(Boolean)
    .map(u => u!);

  // TODO Delete members who already deleted their context.

  logger.debug(`Users in pool`, users);
  return users;
}
