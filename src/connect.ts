import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

import Authorization from "./model/Authorization";
import User from "./model/User";
import { decodeJWT } from "./auth";
import { getAppIds } from "./data/apps";
import { getLogger } from "@yingyeothon/slack-logger";
import responses from "./model/responses";
import setUser from "./redis/user/setUser";
import useRedis from "./redis/useRedis";
import { v4 as uuidv4 } from "uuid";

const logger = getLogger("handle:connect", __filename);

function doAuth(event: APIGatewayProxyEvent) {
  const { authorizer } = event.requestContext;
  if (authorizer !== null && authorizer !== undefined) {
    return authorizer as Authorization;
  }
  const { authorization } = event.queryStringParameters ?? {};
  const [allow, context] = decodeJWT(authorization);
  if (allow) {
    return context!;
  }
  return null;
}

export const handle: APIGatewayProxyHandler = async (event) => {
  const { connectionId } = event.requestContext;
  if (connectionId === undefined) {
    logger.debug({}, `No connectionId`);
    return responses.BadRequest;
  }

  const authorization = doAuth(event);
  if (authorization === null) {
    logger.debug({ event }, `No authorization`);
    return responses.BadRequest;
  }
  logger.debug({ authorization }, `Authorization`);

  const { name, email, applications } = authorization;
  const installedAppIds = await getAppIds();
  const supportedAppIds = applications.filter((id) =>
    installedAppIds.includes(id)
  );
  if (supportedAppIds.length === 0) {
    logger.debug({ email, applications }, `No supported applications`);
    return responses.BadRequest;
  }

  const user: User = {
    userId: uuidv4(),
    name,
    email,
    connectionId,
    applications: supportedAppIds,
  };
  logger.info({ user }, `Setup a new user`);

  const response = await useRedis(async (redisConnection) => {
    try {
      const setResult = await setUser(redisConnection, user);
      logger.debug({ user, setResult }, `Set user`);
      return responses.OK;
    } catch (error) {
      logger.error({ user, error }, `Set user error`);
      return responses.BadRequest;
    }
  });

  await logger.flushSlack();
  return response;
};
