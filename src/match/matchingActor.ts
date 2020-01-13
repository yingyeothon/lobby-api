import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import { Lambda } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import apps from "../data/applications";
import IApplication from "../model/application";
import env from "../model/env";
import redisKeys from "../redis/keys";
import dropConnections from "../support/dropConnections";
import postMessage from "../support/postMessage";
import getRedis from "./getRedis";
import logger from "./logger";

export default class MatchingActor {
  private readonly app: IApplication;
  private readonly redis: IRedisConnection;

  constructor(public readonly id: string) {
    this.app = apps.find(app => app.id === id)!;
    this.redis = getRedis();
  }

  public onMessages = async () => {
    logger.info(`Start matching`, this.id);
    const remaining = await [
      this.tryToMatch,
      this.tryToIncompletedMatch,
      this.tryToDropLongWaiters
    ].reduce(
      (pipeline, applier) => pipeline.then(applier),
      redisSmembers(this.redis, redisKeys.matchingPool(this.id))
    );
    logger.info(`End of matching`, this.id, `remaining`, remaining);
  };

  private tryToMatch = async (connectionIds: string[]) => {
    if (connectionIds.length === 0) {
      return [];
    }
    let matchables = connectionIds;
    while (matchables.length >= this.app.memberCount) {
      const matched = matchables.slice(0, this.app.memberCount);
      matchables = matchables.slice(this.app.memberCount);

      await this.matchPlayers(matched);
    }
    return matchables; // Remaining connectionIds.
  };

  private tryToIncompletedMatch = async (connectionIds: string[]) => {
    const { incompletedMatchingWaitMillis } = this.app;
    if (
      connectionIds.length === 0 ||
      incompletedMatchingWaitMillis === undefined
    ) {
      return connectionIds; // Nothing to do.
    }
    const matchingTimeOfFirst = await redisGet(
      this.redis,
      redisKeys.matchingTime(this.id, connectionIds[0])
    ).then(maybe => (maybe !== null ? +maybe : 0));
    if (Date.now() - matchingTimeOfFirst > incompletedMatchingWaitMillis) {
      await this.matchPlayers(connectionIds);
      return [];
    }
    return connectionIds; // Remaing connectionIds.
  };

  private tryToDropLongWaiters = async (connectionIds: string[]) => {
    const { maxWaitingMillis } = this.app;
    if (connectionIds.length === 0 || maxWaitingMillis === undefined) {
      return connectionIds; // Nothing to do.
    }
    const matchingTimes = await Promise.all(
      connectionIds.map(connectionId =>
        redisGet(
          this.redis,
          redisKeys.matchingTime(this.id, connectionId)
        ).then(maybe => (maybe !== null ? +maybe : 0))
      )
    );
    const now = Date.now();
    const droppables = connectionIds.filter(
      (_, index) => now - matchingTimes[index] > maxWaitingMillis
    );
    logger.info(`Drop old connections`, droppables);
    await this.clearMatchingContext(droppables);
    return connectionIds.filter(
      connectionId => !droppables.includes(connectionId)
    ); // Remaing connectionIds.
  };

  private async matchPlayers(connectionIds: string[]) {
    try {
      // Start a new Lambda to process game messages.
      const gameId = uuidv4();
      const playerIds = Array(connectionIds.length)
        .fill(0)
        .map(_ => uuidv4());
      await this.invokeNewGame(gameId, playerIds);

      // Broadcast new game channel.
      await this.notifyGameChannel(gameId, connectionIds, playerIds);
    } catch (error) {
      logger.error(`Error occurred while matching`, connectionIds, error);
    } finally {
      await this.clearMatchingContext(connectionIds);
    }
  }

  private async invokeNewGame(gameId: string, playerIds: string[]) {
    const invoked = await new Lambda({
      endpoint: env.isOffline ? `http://localhost:3000` : undefined
    })
      .invoke({
        FunctionName: this.app.functionName,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify({
          gameId,
          members: playerIds
        })
      })
      .promise();
    logger.info(`Start new game actor`, invoked);
  }

  private async notifyGameChannel(
    gameId: string,
    connectionIds: string[],
    playerIds: string[]
  ) {
    const sent = await postMessage(connectionIds, (_, index) => ({
      type: "match",
      url: this.app.url,
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
  }

  private async clearMatchingContext(connectionIds: string[]) {
    const deleted = await Promise.all([
      redisSrem(this.redis, redisKeys.matchingPool(this.id), ...connectionIds),
      redisDel(
        this.redis,
        ...connectionIds.map(connectionId =>
          redisKeys.matchingTime(this.id, connectionId)
        )
      )
    ]);
    logger.info(`Delete old matching context`, connectionIds, deleted);

    const dropped = await dropConnections(connectionIds);
    logger.info(`Drop matched connections`, dropped);
  }
}
