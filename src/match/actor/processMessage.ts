import logger from "../logger";
import readUsersFromPool, { IReadEnvironment } from "../readUsersFromPool";
import IMatchProperty from "./env/property";
import IStateManager from "./env/state";
import tryToDropLongWaiters, { DropEnvironment } from "./tryToDropLongWaiters";
import tryToIncompletedMatch, {
  IncompletedMatchEnvironment
} from "./tryToIncompletedMatch";
import tryToMatch, { MatchEnvironment } from "./tryToMatch";

type ProcessEnvironment = Pick<IMatchProperty, "id"> &
  Pick<IStateManager, "smembers"> &
  Omit<IReadEnvironment, "applicationId"> &
  MatchEnvironment &
  IncompletedMatchEnvironment &
  DropEnvironment;

export default function processMessage(env: ProcessEnvironment) {
  const pipeline = [
    tryToMatch(env),
    tryToIncompletedMatch(env),
    tryToDropLongWaiters(env)
  ];
  return async () => {
    logger.info(`Start matching`, env.id);
    try {
      const remaining = await pipeline.reduce(
        (pipe, applier) => pipe.then(applier),
        readUsersFromPool({ ...env, applicationId: env.id })
      );
      logger.info(`End of matching`, env.id, `remaining`, remaining);
    } catch (error) {
      logger.error(`Error occurred while matching`, env.id, error);
    }
  };
}
