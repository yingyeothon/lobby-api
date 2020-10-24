import {
  SuccessRow,
  allOrNoneForSuccessMap,
  successRowAsMap,
} from "./successMap";

import { ApiGatewayManagementApi } from "aws-sdk";
import { LobbyResponse } from "../model/messages";
import { SuccessMap } from "./successMap";
import env from "../model/env";
import { getLogger } from "@yingyeothon/slack-logger";

const logger = getLogger("postMessage", __filename);
const apigw = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint,
});

export default async function postMessage(
  connectionIds: string[],
  messageBuilder: (connectionId: string, index: number) => LobbyResponse
): Promise<SuccessMap> {
  if (connectionIds.length === 0) {
    return {};
  }

  try {
    const values = await Promise.all(
      connectionIds.map((connectionId, index) =>
        apigw
          .postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(messageBuilder(connectionId, index)),
          })
          .promise()
          .then(() => [connectionId, true] as SuccessRow)
          .catch((error) => {
            (/GoneException/.test(error.name) ? logger.debug : logger.error)(
              { connectionId, error },
              `Cannot send message`
            );
            return [connectionId, false] as SuccessRow;
          })
      )
    );
    return successRowAsMap(values);
  } catch (error) {
    logger.error({ connectionIds, error }, `Cannot send all messages`);
    return allOrNoneForSuccessMap(connectionIds, false);
  }
}
