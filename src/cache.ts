import { APIGatewayProxyHandler } from "aws-lambda";
import { clearAppsCache } from "./data/apps";

export const doClearAppsCache: APIGatewayProxyHandler = async () => {
  clearAppsCache();
  return { statusCode: 200, body: "OK" };
};
