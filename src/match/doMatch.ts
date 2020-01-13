import IUser from "../model/user";
import getRedis from "./getRedis";
import logger from "./logger";
import registerToPool from "./registerToPool";
import requestMatch from "./requestMatch";

export default async function doMatch(user: IUser, applicationId: string) {
  const added = await registerToPool(user, getRedis(), applicationId);
  logger.info(`Add to matching pool`, user, applicationId, added);
  return requestMatch(applicationId);
}
