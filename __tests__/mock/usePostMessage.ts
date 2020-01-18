import { LobbyResponse } from "../../src/model/messages";
import { allOrNoneForSuccessMap } from "../../src/support/successMap";

function postMessage(postbox: LobbyResponse[]) {
  return async (
    connectionIds: string[],
    messageBuilder: (connectionId: string, index: number) => LobbyResponse
  ) => {
    connectionIds.map((connectionId, index) =>
      postbox.push(messageBuilder(connectionId, index))
    );
    return allOrNoneForSuccessMap(connectionIds, true);
  };
}

export default function usePostMessage(): [
  LobbyResponse[],
  ReturnType<typeof postMessage>
] {
  const postbox: LobbyResponse[] = [];
  return [postbox, postMessage(postbox)];
}
