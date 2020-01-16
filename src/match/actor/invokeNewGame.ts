import IApplication from "../../model/application";
import IMatchProperty from "./env/property";
import logger from "./logger";

export type GameInvoker = (
  app: IApplication,
  gameId: string,
  members: string[]
) => Promise<any>;

export type InvokeEnvironment = Pick<IMatchProperty, "app"> & {
  invoker: GameInvoker;
};

export default function invokeNewGame({ app, invoker }: InvokeEnvironment) {
  return async (gameId: string, playerIds: string[]) => {
    const invoked = await invoker(app, gameId, playerIds);
    logger.info(`Start new game actor`, invoked);
  };
}
