import { v4 as uuidv4 } from "uuid";
import logger from "../../logger";
import IUser from "../../model/user";
import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";
import invokeNewGame, { InvokeEnvironment } from "./invokeNewGame";
import notifyGameChannel, { NotifyEnvironment } from "./notifyGameChannel";

export type MatchGameEnvironment = InvokeEnvironment &
  NotifyEnvironment &
  ClearEnvironment;

export default function matchGame(env: MatchGameEnvironment) {
  const invoker = invokeNewGame(env);
  const notifier = notifyGameChannel(env);
  const cleaner = clearMatchingContext(env);
  return async (matchedUsers: IUser[]) => {
    try {
      // Start a new Lambda to process game messages.
      const gameId = uuidv4();
      await invoker(gameId, matchedUsers);

      // Broadcast new game channel.
      await notifier(gameId, matchedUsers);

      // Clear context if success.
      await cleaner(matchedUsers.map(u => u.connectionId));
    } catch (error) {
      logger.error(`Cannot match`, matchedUsers, `due to`, error);
    }
  };
}
