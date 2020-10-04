import * as jwt from "jsonwebtoken";

import { APIGatewayAuthorizerHandler } from "aws-lambda";
import Authorization from "./model/Authorization";
import env from "./model/env";
import { getLogger } from "@yingyeothon/slack-logger";

const jwtSecretKey = env.jwtSecretKey;
const logger = getLogger("handle:auth", __filename);

export function decodeJWT(
  authorizationToken: string | undefined
): [boolean, Authorization | undefined] {
  const trimmed = (authorizationToken ?? "").trim();
  const token = trimmed.startsWith("Bearer ")
    ? trimmed.substring("Bearer ".length).trim()
    : trimmed;
  if (token.length === 0) {
    return [false, undefined];
  }
  try {
    const payload = jwt.verify(token, jwtSecretKey) as Authorization;
    return [true, payload];
  } catch (error) {
    logger.info({ authorizationToken, error }, `Invalid JWT`);
    return [false, undefined];
  }
}

export const handle: APIGatewayAuthorizerHandler = async (event) => {
  const token =
    event.type === "TOKEN"
      ? event.authorizationToken
      : (event.queryStringParameters ?? {}).authorization;
  const [allow, context] = decodeJWT(token);
  const policy = {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: event.methodArn,
        },
      ],
    },
    context: context
      ? {
          name: context.name,
          email: context.email,
          application: context.applications[0],
          applications: context.applications.join("+"),
        }
      : null,
  };
  logger.debug({ policy, token }, `auth`);

  await logger.flushSlack();
  return policy;
};
