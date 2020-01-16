import { LobbyResponse } from "../../src/model/messages";
import { allOrNoneForSuccessMap } from "../../src/support/successMap";

export default class MockExchange {
  public readonly postbox: LobbyResponse[] = [];
  public readonly dropped: string[] = [];

  public postMessage = async (
    connectionIds: string[],
    messageBuilder: (connectionId: string, index: number) => LobbyResponse
  ) => {
    connectionIds.map((connectionId, index) =>
      this.postbox.push(messageBuilder(connectionId, index))
    );
    return allOrNoneForSuccessMap(connectionIds, true);
  };

  public dropConnections = async (connectionIds: string[]) => {
    this.dropped.push(...connectionIds);
    return allOrNoneForSuccessMap(connectionIds, true);
  };

  public clear = () => {
    this.postbox.length = 0;
    this.dropped.length = 0;
  };
}
