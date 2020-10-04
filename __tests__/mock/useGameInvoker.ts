import {
  GameInvokeArguments,
  GameInvoker,
  GameMember,
} from "../../src/match/actor/invokeNewGame";

import Application from "../../src/model/Application";

interface IGameInvoked {
  app: Application;
  gameId: string;
  members: GameMember[];
}

export default function useGameInvoker(): [IGameInvoked[], GameInvoker] {
  const invoked: IGameInvoked[] = [];
  const invoker = async (args: GameInvokeArguments) => {
    invoked.push(args);
    return true;
  };
  return [invoked, invoker];
}
