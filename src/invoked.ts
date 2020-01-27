import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import { APIGatewayProxyHandler } from "aws-lambda";
import logger from "./logger";
import subsysPrefix from "./match/redis/subsysPrefix";
import useRedis from "./redis/useRedis";

export const handle: APIGatewayProxyHandler = async event => {
  const pathParameters = event.pathParameters ?? {};
  if (!("appId" in pathParameters)) {
    return { statusCode: 404, body: "NotFound" };
  }
  if (!("gameId" in pathParameters)) {
    return { statusCode: 404, body: "NotFound" };
  }

  const { appId, gameId } = pathParameters;
  logger.info("Start to mark a game as invoked", appId, gameId);

  const resolved = await useRedis(connection =>
    awaiterResolve({
      connection,
      keyPrefix: subsysPrefix.invokerAwaiter,
      logger
    }).resolve(appId, gameId)
  );
  logger.info("Game invoked", appId, gameId, resolved);
  return { statusCode: 200, body: "OK" };
};
