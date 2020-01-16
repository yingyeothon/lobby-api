import IUser from "../model/user";
import redisKeys from "../redis/keys";
import logger from "./logger";

interface IRegisterEnvironment {
  user: IUser;
  applicationId: string;
  sadd: (key: string, value: string) => Promise<any>;
  set: (key: string, value: string) => Promise<any>;
}

export default async function registerToPool({
  user,
  applicationId,
  sadd,
  set
}: IRegisterEnvironment) {
  if (!user.applications.includes(applicationId)) {
    logger.debug(`Invalid application id for matching`, user, applicationId);
    return false;
  }

  const { connectionId } = user;
  const added = await Promise.all([
    sadd(redisKeys.matchingPool(applicationId), connectionId),
    set(
      redisKeys.matchingTime(applicationId, connectionId),
      Date.now().toString()
    )
  ]);
  logger.info(`Add to matching pool`, user, applicationId, added);
  return true;
}
