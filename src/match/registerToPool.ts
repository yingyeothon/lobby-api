import User from "../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import redisKeys from "../redis/keys";

const logger = getLogger("registerToPool", __filename);

interface RegisterEnvironment {
  user: User;
  applicationId: string;
  sadd: (key: string, value: string) => Promise<unknown>;
  set: (key: string, value: string) => Promise<unknown>;
}

export default async function registerToPool({
  user,
  applicationId,
  sadd,
  set,
}: RegisterEnvironment): Promise<boolean> {
  if (!user.applications.includes(applicationId)) {
    logger.debug(
      { user, applicationId },
      `Invalid application id for matching`
    );
    return false;
  }

  const { connectionId } = user;
  const added = await Promise.all([
    sadd(redisKeys.matchingPool(applicationId), connectionId),
    set(
      redisKeys.matchingTime(applicationId, connectionId),
      Date.now().toString()
    ),
  ]);
  logger.info({ user, applicationId, added }, `Add to matching pool`);
  return true;
}
