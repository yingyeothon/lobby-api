import env from "../model/env";
import { newApiGatewayManagementApi } from "@yingyeothon/aws-apigateway-management-api";

export default function dropConnection(connectionId: string): Promise<unknown> {
  return newApiGatewayManagementApi({
    endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint,
  })
    .deleteConnection({
      ConnectionId: connectionId,
    })
    .promise();
}
