import { ApiGatewayManagementApi } from "aws-sdk";
import env from "../model/env";

const apigw = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint,
});

export default function dropConnection(connectionId: string): Promise<unknown> {
  return apigw
    .deleteConnection({
      ConnectionId: connectionId,
    })
    .promise();
}
