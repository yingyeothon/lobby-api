import { ScheduledHandler } from "aws-lambda";
import { getAppIds } from "./data/apps";
import { getLogger } from "@yingyeothon/slack-logger";
import redisConnect from "./redis/connect";
import redisKeys from "./redis/keys";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import requestMatch from "./match/redis/requestMatch";

const redisConnection = redisConnect();
const logger = getLogger("handle:tick", __filename);

export const handle: ScheduledHandler = async () => {
  const installedAppIds = await getAppIds();
  logger.debug({ installedAppIds }, `Start the matching tick`);
  const appIds: string[] = [];
  for (const installedAppId of installedAppIds) {
    const members = await redisSmembers(
      redisConnection,
      redisKeys.matchingPool(installedAppId)
    );
    logger.debug({ installedAppId, members }, `Check matching queue`);
    if (members.length > 0) {
      appIds.push(installedAppId);
    }
  }
  try {
    logger.debug({ appIds }, `Try to match within applications`);
    if (appIds.length > 0) {
      await Promise.all(appIds.map((appId) => requestMatch(appId)));
    }
    logger.debug({ appIds }, `All done`);
  } catch (error) {
    logger.error({ appIds, error }, `Something wrong while matching tick`);
  }

  await logger.flushSlack();
};
