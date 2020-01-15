import { LobbyResponse } from "../../../model/messages";
import { ISuccessMap } from "../../../support/successMap";

export default interface IMessageExchanger {
  postMessage: (
    connectionIds: string[],
    messageBuilder: (connectionId: string, index: number) => LobbyResponse
  ) => Promise<ISuccessMap>;

  dropConnections: (connectionIds: string[]) => Promise<ISuccessMap>;
}
