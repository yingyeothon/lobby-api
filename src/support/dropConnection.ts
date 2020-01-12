import { newApiGatewayManagementApi } from "@yingyeothon/aws-apigateway-management-api";
import env from "../model/env";

export default function dropConnection(connectionId: string) {
  return newApiGatewayManagementApi({
    endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
  })
    .deleteConnection({
      ConnectionId: connectionId
    })
    .promise();
}
