import pLimit from "p-limit";
import logger from "../../logger";
import IUser from "../../model/user";
import IMatchProperty from "./env/property";
import matchGame, { MatchGameEnvironment } from "./matchGame";

export type MatchEnvironment = Pick<IMatchProperty, "app"> &
  MatchGameEnvironment;

export default function tryToMatch(env: MatchEnvironment) {
  return async (input: IUser[]) => {
    if (input.length === 0) {
      return [];
    }
    const matcher = matchGame(env);
    const limit = pLimit(16 /* MAGIC */);
    const promises: Array<Promise<any>> = [];
    let matchables = input;
    while (matchables.length >= env.app.memberCount) {
      const matched = matchables.slice(0, env.app.memberCount);
      matchables = matchables.slice(env.app.memberCount);

      promises.push(limit(() => matcher(matched)));
    }
    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error(`Error in matching`, error);
    }
    return matchables; // Remaining connectionIds.
  };
}
