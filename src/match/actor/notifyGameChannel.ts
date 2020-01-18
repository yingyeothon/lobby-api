import IUser from "../../model/user";
import IMessageExchanger from "./env/message";
import IMatchProperty from "./env/property";
import logger from "./logger";

export type NotifyEnvironment = Pick<IMatchProperty, "app"> &
  Pick<IMessageExchanger, "postMessage">;

export default function notifyGameChannel({
  app,
  postMessage
}: NotifyEnvironment) {
  return async (gameId: string, matchedUsers: IUser[]) => {
    const sent = await postMessage(
      matchedUsers.map(u => u.connectionId),
      (_, index) => ({
        type: "match",
        url: app.url,
        gameId,
        playerId: matchedUsers[index].userId
      })
    );
    logger.info(`Notify a new game channel`, gameId, matchedUsers, sent);
  };
}
