import IMatchProperty from "./env/property";
import matchGame, { MatchGameEnvironment } from "./matchGame";

export type MatchEnvironment = Pick<IMatchProperty, "app"> &
  MatchGameEnvironment;

export default function tryToMatch(env: MatchEnvironment) {
  return async (connectionIds: string[]) => {
    if (connectionIds.length === 0) {
      return [];
    }
    let matchables = connectionIds;
    while (matchables.length >= env.app.memberCount) {
      const matched = matchables.slice(0, env.app.memberCount);
      matchables = matchables.slice(env.app.memberCount);

      await matchGame(env)(matched);
    }
    return matchables; // Remaining connectionIds.
  };
}
