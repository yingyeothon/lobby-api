import {
  GameInvoker,
  IGameInvokeArguments,
  IGameMember
} from "../../src/match/actor/invokeNewGame";
import IApplication from "../../src/model/application";

interface IGameInvoked {
  app: IApplication;
  gameId: string;
  members: IGameMember[];
}

export default function useGameInvoker(): [IGameInvoked[], GameInvoker] {
  const invoked: IGameInvoked[] = [];
  const invoker = async (args: IGameInvokeArguments) => {
    invoked.push(args);
    return true;
  };
  return [invoked, invoker];
}
