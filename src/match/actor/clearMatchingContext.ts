import redisKeys from "../../redis/keys";
import IMessageExchanger from "./env/message";
import IMatchProperty from "./env/property";
import IStateManager from "./env/state";
import logger from "./logger";

export type ClearEnvironment = Pick<IMatchProperty, "id"> &
  Pick<IStateManager, "del" | "srem"> &
  Pick<IMessageExchanger, "dropConnections">;

export default function clearMatchingContext({
  id,
  srem,
  del,
  dropConnections
}: ClearEnvironment) {
  return async (connectionIds: string[]) => {
    if (connectionIds.length === 0) {
      return;
    }

    const deleted = await Promise.all([
      srem(redisKeys.matchingPool(id), ...connectionIds),
      del(
        ...connectionIds.map(connectionId =>
          redisKeys.matchingTime(id, connectionId)
        )
      )
    ]);
    logger.info(`Delete old matching context`, connectionIds, deleted);

    const dropped = await dropConnections(connectionIds);
    logger.info(`Drop matched connections`, dropped);
  };
}
