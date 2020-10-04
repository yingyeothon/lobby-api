import readUsersFromPool, { ReadEnvironment } from "../readUsersFromPool";
import tryToDropLongWaiters, { DropEnvironment } from "./tryToDropLongWaiters";
import tryToIncompletedMatch, {
  IncompletedMatchEnvironment,
} from "./tryToIncompletedMatch";
import tryToMatch, { MatchEnvironment } from "./tryToMatch";

import MatchProperty from "./env/property";
import StateManager from "./env/state";
import { getLogger } from "@yingyeothon/slack-logger";

type ProcessEnvironment = Pick<MatchProperty, "id"> &
  Pick<StateManager, "smembers"> &
  Omit<ReadEnvironment, "applicationId"> &
  MatchEnvironment &
  IncompletedMatchEnvironment &
  DropEnvironment;

const logger = getLogger("processMessage", __filename);

export default function processMessage(
  env: ProcessEnvironment
): () => Promise<void> {
  const pipeline = [
    tryToMatch(env),
    tryToIncompletedMatch(env),
    tryToDropLongWaiters(env),
  ];
  return async () => {
    logger.info({ id: env.id }, `Start matching`);
    try {
      const remaining = await pipeline.reduce(
        (pipe, applier) => pipe.then(applier),
        readUsersFromPool({ ...env, applicationId: env.id })
      );
      logger.info({ id: env.id, remaining }, `End of matching`);
    } catch (error) {
      logger.error({ id: env.id, error }, `Error occurred while matching`);
    }
  };
}
