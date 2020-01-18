import IUser from "../../model/user";
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
  return async (input: IUser[]) => {
    const {
      app: { incompletedMatchingWaitMillis },
      id
    } = env;
    if (input.length === 0 || incompletedMatchingWaitMillis === undefined) {
      return input; // Nothing to do.
    }
    const matchingTimeOfFirst = await env
      .get(redisKeys.matchingTime(id, input[0].connectionId))
      .then(maybe => (maybe !== null ? +maybe : 0));

    // It is too early matching incompleted.
    if (Date.now() - matchingTimeOfFirst <= incompletedMatchingWaitMillis) {
      return input;
    }

    // Do match all remaining members.
    await matchGame(env)(input);
    return [];
  };
}
