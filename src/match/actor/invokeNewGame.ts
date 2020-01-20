import IApplication from "../../model/application";
import IUser from "../../model/user";
import IMatchProperty from "./env/property";
import logger from "./logger";

export interface IGameMember {
  memberId: string;
  name: string;
  email: string;
}

export type GameInvoker = (
  app: IApplication,
  gameId: string,
  members: IGameMember[]
) => Promise<any>;

export type InvokeEnvironment = Pick<IMatchProperty, "app"> & {
  invoker: GameInvoker;
};

function sleep(millis: number) {
  return new Promise<void>(resolve => setTimeout(resolve, millis));
}

export default function invokeNewGame({ app, invoker }: InvokeEnvironment) {
  return async (gameId: string, matchedUsers: IUser[]) => {
    const invoked = await invoker(
      app,
      gameId,
      matchedUsers.map(({ userId: memberId, name, email }) => ({
        memberId,
        name,
        email
      }))
    );
    logger.info(`Start new game actor`, invoked);

    // Wait roughly until a game lambda is started.
    // TODO It should be replaced by awaiter.
    await sleep(500 /* MAGIC NUMBER */);
  };
}
