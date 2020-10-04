import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";
import invokeNewGame, { InvokeEnvironment } from "./invokeNewGame";
import notifyGameChannel, { NotifyEnvironment } from "./notifyGameChannel";

import User from "../../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import { v4 as uuidv4 } from "uuid";

export type MatchGameEnvironment = InvokeEnvironment &
  NotifyEnvironment &
  ClearEnvironment;

type Matcher = (matcherUsers: User[]) => Promise<void>;

const logger = getLogger("matchGame", __filename);

export default function matchGame(env: MatchGameEnvironment): Matcher {
  const invoker = invokeNewGame(env);
  const notifier = notifyGameChannel(env);
  const cleaner = clearMatchingContext(env);
  return async (matchedUsers: User[]) => {
    try {
      // Start a new Lambda to process game messages.
      const gameId = uuidv4();
      if (await invoker(gameId, matchedUsers)) {
        // Broadcast new game channel.
        await notifier(gameId, matchedUsers);

        // Clear context if success.
        await cleaner(matchedUsers.map((u) => u.connectionId));
      }
    } catch (error) {
      logger.error({ matchedUsers, error }, `Cannot match`);
    }
  };
}
