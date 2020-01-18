import { GameInvoker, IGameMember } from "../../src/match/actor/invokeNewGame";
import IApplication from "../../src/model/application";

interface IGameInvoked {
  app: IApplication;
  gameId: string;
  members: IGameMember[];
}

export default function useGameInvoker(): [IGameInvoked[], GameInvoker] {
  const invoked: IGameInvoked[] = [];
  const invoker = async (
    app: IApplication,
    gameId: string,
    members: IGameMember[]
  ) => {
    invoked.push({ app, gameId, members });
  };
  return [invoked, invoker];
}
