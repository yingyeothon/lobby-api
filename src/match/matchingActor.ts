import { Lambda } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import IApplication from "../model/application";
import env from "../model/env";
import { LobbyResponse } from "../model/messages";
import redisKeys from "../redis/keys";
import { ISuccessMap } from "../support/successMap";
import logger from "./logger";

// tslint:disable-next-line:interface-over-type-literal
export type IMatchingActor = {
  id: string,
  app: IApplication,
  smembers(key: string): Promise<string[]>,
  get(key: string): Promise<string | null>,
  srem(key: string, ...values: string[]): Promise<number>,
  del(...keys: string[]): Promise<number>,
  dropConnections(connectionIds: string[]): Promise<ISuccessMap>,
  postMessage(connectionIds: string[], messageBuilder: (connectionId: string, index: number) => LobbyResponse): Promise<{} | ISuccessMap>
}

export const onMessages = (m: IMatchingActor) => async () => {
  logger.info(`Start matching`, m.id);
  const remaining = await [
    tryToMatch(m),
    tryToIncompletedMatch(m),
    tryToDropLongWaiters(m),
  ].reduce(
    (pipeline, applier) => pipeline.then(applier),
    m.smembers(redisKeys.matchingPool(m.id))
  );
  logger.info(`End of matching`, m.id, `remaining`, remaining);
};

const tryToMatch = (m: IMatchingActor) => async (connectionIds: string[]) => {
  if (connectionIds.length === 0) {
    return [];
  }
  let matchables = connectionIds;
  while (matchables.length >= m.app.memberCount) {
    const matched = matchables.slice(0, m.app.memberCount);
    matchables = matchables.slice(m.app.memberCount);

    await matchPlayers(m)(matched);
  }
  return matchables; // Remaining connectionIds.
};

const tryToIncompletedMatch = (m: IMatchingActor) => async (connectionIds: string[]) => {
  const { incompletedMatchingWaitMillis } = m.app;
  if (
    connectionIds.length === 0 ||
    incompletedMatchingWaitMillis === undefined
  ) {
    return connectionIds; // Nothing to do.
  }
  const matchingTimeOfFirst = await m.get(
    redisKeys.matchingTime(m.id, connectionIds[0])
  ).then(maybe => (maybe !== null ? +maybe : 0));
  if (Date.now() - matchingTimeOfFirst > incompletedMatchingWaitMillis) {
    await matchPlayers(m)(connectionIds);
    return [];
  }
  return connectionIds; // Remaing connectionIds.
};

const tryToDropLongWaiters = (m: IMatchingActor) => async (connectionIds: string[]) => {
  const { maxWaitingMillis } = m.app;
  if (connectionIds.length === 0 || maxWaitingMillis === undefined) {
    return connectionIds; // Nothing to do.
  }
  const matchingTimes = await Promise.all(
    connectionIds.map(connectionId =>
      m.get(
        redisKeys.matchingTime(m.id, connectionId)
      ).then(maybe => (maybe !== null ? +maybe : 0))
    )
  );
  const now = Date.now();
  const droppables = connectionIds.filter(
    (_, index) => now - matchingTimes[index] > maxWaitingMillis
  );
  logger.info(`Drop old connections`, droppables);
  await clearMatchingContext(m)(droppables);
  return connectionIds.filter(
    connectionId => !droppables.includes(connectionId)
  ); // Remaing connectionIds.
};

const matchPlayers = (m: IMatchingActor) => async (connectionIds: string[]) => {
  try {
    // Start a new Lambda to process game messages.
    const gameId = uuidv4();
    const playerIds = Array(connectionIds.length)
      .fill(0)
      .map(_ => uuidv4());
    await invokeNewGame(m)(gameId, playerIds);

    // Broadcast new game channel.
    await notifyGameChannel(m)(gameId, connectionIds, playerIds);
  } catch (error) {
    logger.error(`Error occurred while matching`, connectionIds, error);
  } finally {
    await clearMatchingContext(m)(connectionIds);
  }
};

const invokeNewGame = (m: IMatchingActor) => async (gameId: string, playerIds: string[]) => {
  const invoked = await new Lambda({
    endpoint: env.isOffline ? `http://localhost:3000` : undefined
  })
    .invoke({
      FunctionName: m.app.functionName,
      InvocationType: "Event",
      Qualifier: "$LATEST",
      Payload: JSON.stringify({
        gameId,
        members: playerIds
      })
    })
    .promise();
  logger.info(`Start new game actor`, invoked);
};

const notifyGameChannel = (m: IMatchingActor) => async (
  gameId: string,
  connectionIds: string[],
  playerIds: string[]
) => {
  const sent = await m.postMessage(connectionIds, (_, index) => ({
    type: "match",
    url: m.app.url,
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

const clearMatchingContext = (m: IMatchingActor) => async (connectionIds: string[]) => {
  const deleted = await Promise.all([
    m.srem(redisKeys.matchingPool(m.id), ...connectionIds),
    m.del(
      ...connectionIds.map(connectionId =>
        redisKeys.matchingTime(m.id, connectionId)
      )
    )
  ]);
  logger.info(`Delete old matching context`, connectionIds, deleted);

  const dropped = await m.dropConnections(connectionIds);
  logger.info(`Drop matched connections`, dropped);
};
