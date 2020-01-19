import { v4 as uuidv4 } from "uuid";
import IUser from "../../model/user";
import clearMatchingContext, { ClearEnvironment } from "./clearMatchingContext";
import invokeNewGame, { InvokeEnvironment } from "./invokeNewGame";
import notifyGameChannel, { NotifyEnvironment } from "./notifyGameChannel";

export type MatchGameEnvironment = InvokeEnvironment &
  NotifyEnvironment &
  ClearEnvironment;

export default function matchGame(env: MatchGameEnvironment) {
  return async (matchedUsers: IUser[]) => {
    // Start a new Lambda to process game messages.
    const gameId = uuidv4();
    await invokeNewGame(env)(gameId, matchedUsers);

    // Broadcast new game channel.
    await notifyGameChannel(env)(gameId, matchedUsers);

    // Clear context if success.
    await clearMatchingContext(env)(matchedUsers.map(u => u.connectionId));
  };
}
