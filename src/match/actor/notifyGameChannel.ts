import IMessageExchanger from "./env/message";
import IMatchProperty from "./env/property";
import logger from "./logger";

export type NotifyEnvironment = Pick<IMatchProperty, "app"> &
  Pick<IMessageExchanger, "postMessage">;

export default function notifyGameChannel({
  app,
  postMessage
}: NotifyEnvironment) {
  return async (
    gameId: string,
    connectionIds: string[],
    playerIds: string[]
  ) => {
    const sent = await postMessage(connectionIds, (_, index) => ({
      type: "match",
      url: app.url,
      gameId,
      playerId: playerIds[index]
    }));
    logger.info(
      `Notify a new game channel`,
      gameId,
      playerIds,
      connectionIds,
      sent
    );
  };
}
