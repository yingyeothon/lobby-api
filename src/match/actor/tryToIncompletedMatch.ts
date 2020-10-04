import matchGame, { MatchGameEnvironment } from "./matchGame";

import MatchProperty from "./env/property";
import StateManager from "./env/state";
import User from "../../model/User";
import redisKeys from "../../redis/keys";

export type IncompletedMatchEnvironment = MatchProperty &
  Pick<StateManager, "get"> &
  MatchGameEnvironment;

export default function tryToIncompletedMatch(
  env: IncompletedMatchEnvironment
) {
  return async (input: User[]): Promise<User[]> => {
    const {
      app: { incompletedMatchingWaitMillis },
      id,
    } = env;
    if (input.length === 0 || incompletedMatchingWaitMillis === undefined) {
      return input; // Nothing to do.
    }
    const matchingTimeOfFirst = await env
      .get(redisKeys.matchingTime(id, input[0].connectionId))
      .then((maybe) => (maybe !== null ? +maybe : 0));

    // It is too early matching incompleted.
    if (Date.now() - matchingTimeOfFirst <= incompletedMatchingWaitMillis) {
      return input;
    }

    // Do match all remaining members.
    await matchGame(env)(input);
    return [];
  };
}
