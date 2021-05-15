import matchGame, { MatchGameEnvironment } from "./matchGame";

import MatchProperty from "./env/property";
import User from "../../model/User";
import { getLogger } from "@yingyeothon/slack-logger";
import pLimit from "p-limit";

export type MatchEnvironment = Pick<MatchProperty, "app"> &
  MatchGameEnvironment;

type TryToMatch = (input: User[]) => Promise<User[]>;

const logger = getLogger("tryToMatch", __filename);

export default function tryToMatch(env: MatchEnvironment): TryToMatch {
  function newMatchWork(users: User[]): () => Promise<void> {
    const matcher = matchGame(env);
    return function () {
      return matcher(users);
    };
  }

  return async (input: User[]): Promise<User[]> => {
    if (input.length === 0) {
      return [];
    }
    const limit = pLimit(16 /* MAGIC */);
    const promises: Array<Promise<void>> = [];
    let matchables = input;
    while (matchables.length >= env.app.memberCount) {
      const matched = matchables.slice(0, env.app.memberCount);
      matchables = matchables.slice(env.app.memberCount);

      promises.push(limit(newMatchWork(matched)));
    }
    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error({ error }, `Error in matching`);
    }
    return matchables; // Remaining connectionIds.
  };
}
