import { v4 as uuidv4 } from "uuid";
import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";
import invokeNewGame, { InvokeEnvironment } from "./invokeNewGame";
import logger from "./logger";
import notifyGameChannel, { NotifyEnvironment } from "./notifyGameChannel";

export type MatchGameEnvironment = InvokeEnvironment &
  NotifyEnvironment &
  ClearEnvironment;

export default function matchGame(env: MatchGameEnvironment) {
  return async (connectionIds: string[]) => {
    try {
      // Start a new Lambda to process game messages.
      const gameId = uuidv4();
      const playerIds = Array(connectionIds.length)
        .fill(0)
        .map(_ => uuidv4());
      await invokeNewGame(env)(gameId, playerIds);

      // Broadcast new game channel.
      await notifyGameChannel(env)(gameId, connectionIds, playerIds);
    } catch (error) {
      logger.error(`Error occurred while matching`, connectionIds, error);
    } finally {
      await clearMatchingContext(env)(connectionIds);
    }
  };
}
