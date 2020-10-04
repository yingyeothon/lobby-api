import { LobbyResponse } from "../../../model/messages";
import { SuccessMap } from "../../../support/successMap";

export default interface MessageExchanger {
  postMessage: (
    connectionIds: string[],
    messageBuilder: (connectionId: string, index: number) => LobbyResponse
  ) => Promise<SuccessMap>;

  dropConnections: (connectionIds: string[]) => Promise<SuccessMap>;
}
