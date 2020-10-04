import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";

import MatchProperty from "./env/property";
import StateManager from "./env/state";
import User from "../../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import redisKeys from "../../redis/keys";

export type DropEnvironment = Pick<MatchProperty, "app"> &
  Pick<StateManager, "get"> &
  ClearEnvironment;

const logger = getLogger("tryToDropLongWaiters", __filename);

export default function tryToDropLongWaiters(env: DropEnvironment) {
  return async (remaining: User[]): Promise<User[]> => {
    const { maxWaitingMillis } = env.app;
    if (remaining.length === 0 || maxWaitingMillis === undefined) {
      return remaining; // Nothing to do.
    }
    const connectionIds = remaining.map((u) => u.connectionId);
    const matchingTimes = await Promise.all(
      connectionIds.map((connectionId) =>
        env
          .get(redisKeys.matchingTime(env.id, connectionId))
          .then((maybe) => (maybe !== null ? +maybe : 0))
      )
    );
    const now = Date.now();
    const droppables = connectionIds.filter(
      (_, index) => now - matchingTimes[index] > maxWaitingMillis
    );
    if (droppables.length === 0) {
      return remaining;
    }

    logger.info({ droppables }, `Drop old connections`);
    await clearMatchingContext(env)(droppables);

    // Remaing users.
    return remaining.filter((u) => !droppables.includes(u.connectionId));
  };
}
