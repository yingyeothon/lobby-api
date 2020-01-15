import redisKeys from "../../redis/keys";
import IMatchProperty from "./env/property";
import IStateManager from "./env/state";
import matchGame, { MatchGameEnvironment } from "./matchGame";

export type IncompletedMatchEnvironment = IMatchProperty &
  Pick<IStateManager, "get"> &
  MatchGameEnvironment;

export default function tryToIncompletedMatch(
  env: IncompletedMatchEnvironment
) {
  return async (connectionIds: string[]) => {
    const { app, id } = env;
    const { incompletedMatchingWaitMillis } = app;
    if (
      connectionIds.length === 0 ||
      incompletedMatchingWaitMillis === undefined
    ) {
      return connectionIds; // Nothing to do.
    }
    const matchingTimeOfFirst = await env
      .get(redisKeys.matchingTime(id, connectionIds[0]))
      .then(maybe => (maybe !== null ? +maybe : 0));
    if (Date.now() - matchingTimeOfFirst > incompletedMatchingWaitMillis) {
      await matchGame(env)(connectionIds);
      return [];
    }
    return connectionIds; // Remaing connectionIds.
  };
}
