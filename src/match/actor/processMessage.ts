import redisKeys from "../../redis/keys";
import logger from "../logger";
import IMatchProperty from "./env/property";
import IStateManager from "./env/state";
import tryToDropLongWaiters, { DropEnvironment } from "./tryToDropLongWaiters";
import tryToIncompletedMatch, {
  IncompletedMatchEnvironment
} from "./tryToIncompletedMatch";
import tryToMatch, { MatchEnvironment } from "./tryToMatch";

type ProcessEnvironment = Pick<IMatchProperty, "id"> &
  Pick<IStateManager, "smembers"> &
  MatchEnvironment &
  IncompletedMatchEnvironment &
  DropEnvironment;

export default function processMessage(env: ProcessEnvironment) {
  return async () => {
    logger.info(`Start matching`, env.id);
    const remaining = await [
      tryToMatch(env),
      tryToIncompletedMatch(env),
      tryToDropLongWaiters(env)
    ].reduce(
      (pipeline, applier) => pipeline.then(applier),
      env.smembers(redisKeys.matchingPool(env.id))
    );
    logger.info(`End of matching`, env.id, `remaining`, remaining);
  };
}
