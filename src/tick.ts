import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import { ScheduledHandler } from "aws-lambda";
import apps from "./data/applications";
import logger from "./logger";
import requestMatch from "./match/redis/requestMatch";
import redisKeys from "./redis/keys";
import useRedis from "./redis/useRedis";

export const handle: ScheduledHandler = async () => {
  logger.info(`Start the matching tick`);
  const appIds = await useRedis(async redisConnection => {
    const targetAppIds: string[] = [];
    for (const app of apps) {
      const members = await redisSmembers(
        redisConnection,
        redisKeys.matchingPool(app.id)
      );
      if (members.length > 0) {
        targetAppIds.push(app.id);
      }
    }
    return targetAppIds;
  });
  try {
    logger.info(`Try to match within applications`, appIds);
    await Promise.all(appIds.map(appId => requestMatch(appId)));
    logger.info(`All done`);
  } catch (error) {
    logger.error(`Something wrong while matching tick`, error);
  }
};
