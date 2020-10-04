import { LobbyResponse } from "../model/messages";
import { SuccessMap } from "./successMap";
import postMessage from "./postMessage";

export default function broadcastMessage(
  connectionIds: string[],
  message: LobbyResponse
): Promise<SuccessMap> {
  return postMessage(connectionIds, () => message);
}
