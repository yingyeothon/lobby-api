import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { decodeJWT } from "./auth";
import { getAppIds } from "./data/apps";
import logger from "./logger";
import IAuthorization from "./model/authorization";
import responses from "./model/responses";
import IUser from "./model/user";
import setUser from "./redis/user/setUser";
import useRedis from "./redis/useRedis";

// I don't know why I can't use Lambda authorizer properly in this context,
// so I have to use this code even it is a sad thing.
function doAuth(event: APIGatewayEvent): [boolean, IAuthorization | undefined] {
  if (
    event.requestContext.authorizer === undefined ||
    event.requestContext.authorizer === null
  ) {
    const [allow, payload] = decodeJWT(event.headers.Authorization);
    if (!allow) {
      return [false, undefined];
    }
    return [allow, payload];
  }

  const authorization = event.requestContext.authorizer as IAuthorization;
  return [true, authorization];
}

export const handle: APIGatewayProxyHandler = async event => {
  const { connectionId } = event.requestContext;
  if (connectionId === undefined) {
    logger.debug(`No connectionId`);
    return responses.BadRequest;
  }

  const [allow, jwtPayload] = doAuth(event);
  if (!allow) {
    logger.debug(`No authorization`, JSON.stringify(event, null, 2));
    return responses.BadRequest;
  }

  const authorization = jwtPayload!;
  logger.debug(`Authorization`, authorization);

  const { name, email, applications } = authorization;
  const installedAppIds = await getAppIds();
  const supportedAppIds = applications.filter(id =>
    installedAppIds.includes(id)
  );
  if (supportedAppIds.length === 0) {
    logger.debug(`No supported applications`);
    return responses.BadRequest;
  }

  const user: IUser = {
    userId: uuidv4(),
    name,
    email,
    connectionId,
    applications: supportedAppIds
  };
  logger.info(`Setup a new user`, user);

  return useRedis(async redisConnection => {
    try {
      const setResult = await setUser(redisConnection, user);
      logger.debug(`User`, user, `redisResponse`, setResult);
      return responses.OK;
    } catch (error) {
      logger.error(`User`, user, `redisError`, error);
      return responses.BadRequest;
    }
  });
};
