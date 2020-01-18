import IUser from "../../model/user";
import redisKeys from "../../redis/keys";
import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";
import IMatchProperty from "./env/property";
import IStateManager from "./env/state";
import logger from "./logger";

export type DropEnvironment = Pick<IMatchProperty, "app"> &
  Pick<IStateManager, "get"> &
  ClearEnvironment;

export default function tryToDropLongWaiters(env: DropEnvironment) {
  return async (remaining: IUser[]) => {
    const { maxWaitingMillis } = env.app;
    if (remaining.length === 0 || maxWaitingMillis === undefined) {
      return remaining; // Nothing to do.
    }
    const connectionIds = remaining.map(u => u.connectionId);
    const matchingTimes = await Promise.all(
      connectionIds.map(connectionId =>
        env
          .get(redisKeys.matchingTime(env.id, connectionId))
          .then(maybe => (maybe !== null ? +maybe : 0))
      )
    );
    const now = Date.now();
    const droppables = connectionIds.filter(
      (_, index) => now - matchingTimes[index] > maxWaitingMillis
    );
    logger.info(`Drop old connections`, droppables);
    await clearMatchingContext(env)(droppables);

    // Remaing users.
    return remaining.filter(u => !droppables.includes(u.connectionId));
  };
}
