import { APIGatewayProxyHandler } from "aws-lambda";
import logger from "./logger";
import doMatch from "./match/redis/doMatch";
import getRedis from "./match/redis/getRedis";
import { LobbyRequest } from "./model/messages";
import responses from "./model/responses";
import getUser from "./redis/user/getUser";
import dropConnection from "./support/dropConnection";

function validateRequest({
  body
}: {
  body: string | undefined | null;
}): [boolean, Partial<LobbyRequest> | undefined] {
  if (body === null || body === undefined || body.length === 0) {
    logger.debug(`No body`);
    return [false, undefined];
  }

  try {
    const request = JSON.parse(body) as Partial<LobbyRequest> | undefined;
    return [request !== undefined, request];
  } catch (error) {
    // Ignore
  }
  return [false, undefined];
}

export const handle: APIGatewayProxyHandler = async event => {
  const {
    body,
    requestContext: { connectionId }
  } = event;
  if (connectionId === undefined) {
    logger.debug(`No connectionId`);
    return responses.BadRequest;
  }
  const [valid, maybeRequest] = validateRequest(event);
  if (!valid) {
    logger.info(
      `Drop the connection that sent invalid message`,
      connectionId,
      body
    );
    await dropConnection(connectionId);
    return responses.BadRequest;
  }

  const request = maybeRequest!;
  const user = await getUser(getRedis(), connectionId);
  if (user === null) {
    logger.info(`Invalid user context`, connectionId, user);
    await dropConnection(connectionId);
    return responses.BadRequest;
  }

  switch (request.type) {
    case "match":
      // Register this user to matching pool.
      if (request.application === undefined) {
        logger.debug(`No application for matching`);
        return responses.BadRequest;
      }
      if (!user.applications.includes(request.application)) {
        logger.debug(`Invalid application id for matching`, user, request);
        return responses.BadRequest;
      }
      // Try to matching.
      await doMatch(user, request.application);
      break;
  }

  return {
    statusCode: 200,
    body: "OK"
  };
};
