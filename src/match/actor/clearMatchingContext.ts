import MatchProperty from "./env/property";
import MessageExchanger from "./env/message";
import StateManager from "./env/state";
import { getLogger } from "@yingyeothon/slack-logger";
import redisKeys from "../../redis/keys";

export type ClearEnvironment = Pick<MatchProperty, "id"> &
  Pick<StateManager, "del" | "srem"> &
  Pick<MessageExchanger, "dropConnections">;

const logger = getLogger("clearMatchingContext", __filename);

export default function clearMatchingContext({
  id,
  srem,
  del,
  dropConnections,
}: ClearEnvironment) {
  return async (connectionIds: string[]): Promise<void> => {
    if (connectionIds.length === 0) {
      return;
    }

    const deleted = await Promise.all([
      srem(redisKeys.matchingPool(id), ...connectionIds),
      del(
        ...connectionIds.map((connectionId) =>
          redisKeys.matchingTime(id, connectionId)
        )
      ),
    ]);
    logger.debug({ connectionIds, deleted }, `Delete old matching context`);

    const dropped = await dropConnections(connectionIds);
    logger.debug({ dropped }, `Drop matched connections`);
  };
}
