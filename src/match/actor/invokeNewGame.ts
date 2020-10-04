import Application from "../../model/Application";
import MatchProperty from "./env/property";
import User from "../../model/User";
import env from "../../model/env";
import { getLogger } from "@yingyeothon/slack-logger";

export interface GameMember {
  memberId: string;
  name: string;
  email: string;
}

export interface GameInvokeArguments {
  app: Application;
  gameId: string;
  members: GameMember[];
  callbackUrl: string;
}

export type GameInvoker = (args: GameInvokeArguments) => Promise<boolean>;

export type InvokeEnvironment = Pick<MatchProperty, "app"> & {
  invoker: GameInvoker;
};

const logger = getLogger("invokeNewGame", __filename);

export default function invokeNewGame({ app, invoker }: InvokeEnvironment) {
  return async (gameId: string, matchedUsers: User[]): Promise<boolean> => {
    const invoked = await invoker({
      app,
      gameId,
      members: matchedUsers.map(({ userId: memberId, name, email }) => ({
        memberId,
        name,
        email,
      })),
      callbackUrl: [env.callbackUrlPrefix, app.id, gameId].join("/"),
    });
    logger.info({ invoked }, `Start new game actor`);
    return invoked;
  };
}
