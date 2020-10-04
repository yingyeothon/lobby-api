import { APIGatewayProxyHandler } from "aws-lambda";
import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import { getLogger } from "@yingyeothon/slack-logger";
import subsysPrefix from "./match/redis/subsysPrefix";
import useRedis from "./redis/useRedis";

const logger = getLogger("handle:invoked", __filename);

export const handle: APIGatewayProxyHandler = async (event) => {
  const pathParameters = event.pathParameters ?? {};
  if (!("appId" in pathParameters)) {
    return { statusCode: 404, body: "NotFound" };
  }
  if (!("gameId" in pathParameters)) {
    return { statusCode: 404, body: "NotFound" };
  }

  const { appId, gameId } = pathParameters;
  logger.info({ appId, gameId }, "Start to mark a game as invoked");

  const resolved = await useRedis((connection) =>
    awaiterResolve({
      connection,
      keyPrefix: subsysPrefix.invokerAwaiter,
    }).resolve(appId, gameId)
  );
  logger.info({ appId, gameId, resolved }, "Game invoked");

  await logger.flushSlack();
  return { statusCode: 200, body: "OK" };
};
