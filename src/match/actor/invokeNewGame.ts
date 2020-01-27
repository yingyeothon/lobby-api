import IApplication from "../../model/application";
import env from "../../model/env";
import IUser from "../../model/user";
import IMatchProperty from "./env/property";
import logger from "./logger";

export interface IGameMember {
  memberId: string;
  name: string;
  email: string;
}

export interface IGameInvokeArguments {
  app: IApplication;
  gameId: string;
  members: IGameMember[];
  callbackUrl: string;
}

export type GameInvoker = (args: IGameInvokeArguments) => Promise<boolean>;

export type InvokeEnvironment = Pick<IMatchProperty, "app"> & {
  invoker: GameInvoker;
};

export default function invokeNewGame({ app, invoker }: InvokeEnvironment) {
  return async (gameId: string, matchedUsers: IUser[]): Promise<boolean> => {
    const invoked = await invoker({
      app,
      gameId,
      members: matchedUsers.map(({ userId: memberId, name, email }) => ({
        memberId,
        name,
        email
      })),
      callbackUrl: [env.callbackUrlPrefix, app.id, gameId].join("/")
    });
    logger.info(`Start new game actor`, invoked);
    return invoked;
  };
}
