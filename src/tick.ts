import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import { ScheduledHandler } from "aws-lambda";
import { getAppIds } from "./data/apps";
import logger from "./logger";
import requestMatch from "./match/redis/requestMatch";
import redisConnect from "./redis/connect";
import redisKeys from "./redis/keys";

const redisConnection = redisConnect();

export const handle: ScheduledHandler = async () => {
  logger.info(`Start the matching tick`);
  const installedAppIds = await getAppIds();
  const appIds: string[] = [];
  for (const installedAppId of installedAppIds) {
    const members = await redisSmembers(
      redisConnection,
      redisKeys.matchingPool(installedAppId)
    );
    logger.info(`Check matching queue`, installedAppId, members);
    if (members.length > 0) {
      appIds.push(installedAppId);
    }
  }
  try {
    logger.info(`Try to match within applications`, appIds);
    if (appIds.length > 0) {
      await Promise.all(appIds.map(appId => requestMatch(appId)));
    }
    logger.info(`All done`);
  } catch (error) {
    logger.error(`Something wrong while matching tick`, error);
  }
};
