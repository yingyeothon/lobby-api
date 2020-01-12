import { ConsoleLogger } from "@yingyeothon/logger";
import { ApiGatewayManagementApi } from "aws-sdk";
import env from "../model/env";
import { LobbyResponse } from "../model/messages";

const apigw = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
});
const logger = new ConsoleLogger(`error`);

type SuccessRow = [string, boolean];
interface ISuccessMap {
  [connectionId: string]: boolean;
}

export default async function postMessage(
  connectionIds: string[],
  message: LobbyResponse
) {
  if (!message || !connectionIds || connectionIds.length === 0) {
    return {};
  }

  const data = JSON.stringify(message);
  try {
    const values = await Promise.all(
      connectionIds.map(connectionId =>
        apigw
          .postToConnection({
            ConnectionId: connectionId,
            Data: data
          })
          .promise()
          .then(() => [connectionId, true] as SuccessRow)
          .catch(error => {
            logger.error(`Cannot send message`, connectionId, error);
            return [connectionId, false] as SuccessRow;
          })
      )
    );
    return values.reduce(
      (obj, [id, success]) => Object.assign(obj, { [id]: success }),
      {} as ISuccessMap
    );
  } catch (error) {
    logger.error(`Cannot send all messages`, message, connectionIds, error);
    return connectionIds.reduce(
      (obj, id) => Object.assign(obj, { [id]: false }),
      {} as ISuccessMap
    );
  }
}
