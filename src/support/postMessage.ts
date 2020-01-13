import { ApiGatewayManagementApi } from "aws-sdk";
import env from "../model/env";
import { LobbyResponse } from "../model/messages";
import logger from "./logger";
import {
  allOrNoneForSuccessMap,
  SuccessRow,
  successRowAsMap
} from "./successMap";

const apigw = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
});

export default async function postMessage(
  connectionIds: string[],
  messageBuilder: (connectionId: string, index: number) => LobbyResponse
) {
  if (connectionIds.length === 0) {
    return {};
  }

  try {
    const values = await Promise.all(
      connectionIds.map((connectionId, index) =>
        apigw
          .postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(messageBuilder(connectionId, index))
          })
          .promise()
          .then(() => [connectionId, true] as SuccessRow)
          .catch(error => {
            logger.error(`Cannot send message`, connectionId, error);
            return [connectionId, false] as SuccessRow;
          })
      )
    );
    return successRowAsMap(values);
  } catch (error) {
    logger.error(`Cannot send all messages`, connectionIds, error);
    return allOrNoneForSuccessMap(connectionIds, false);
  }
}
