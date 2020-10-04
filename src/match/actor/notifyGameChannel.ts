import MatchProperty from "./env/property";
import MessageExchanger from "./env/message";
import User from "../../model/User";
import { getLogger } from "@yingyeothon/slack-logger";

export type NotifyEnvironment = Pick<MatchProperty, "app"> &
  Pick<MessageExchanger, "postMessage">;

type Notifier = (gameId: string, matchedUsers: User[]) => Promise<void>;

const logger = getLogger("notifyGameChannel", __filename);

export default function notifyGameChannel({
  app,
  postMessage,
}: NotifyEnvironment): Notifier {
  return async (gameId: string, matchedUsers: User[]) => {
    const sent = await postMessage(
      matchedUsers.map((u) => u.connectionId),
      (_, index) => ({
        type: "match",
        url: app.url,
        gameId,
        playerId: matchedUsers[index].userId,
      })
    );
    logger.info({ gameId, matchedUsers, sent }, `Notify a new game channel`);
  };
}
