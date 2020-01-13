import { LobbyResponse } from "../model/messages";
import postMessage from "./postMessage";

export default function broadcastMessage(
  connectionIds: string[],
  message: LobbyResponse
) {
  return postMessage(connectionIds, () => message);
}
