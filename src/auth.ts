import * as jwt from "jsonwebtoken";

import { APIGatewayAuthorizerHandler } from "aws-lambda";
import Authorization from "./model/Authorization";
import env from "./model/env";
import { getLogger } from "@yingyeothon/slack-logger";

const jwtSecretKey = env.jwtSecretKey;
const logger = getLogger("handle:auth", __filename);

interface AuthorizationWithLegacy {
  name: string;
  email: string;
  application?: string; // From new issuer
  applications?: string[]; // From old issuer
}

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
    const payload = jwt.verify(token, jwtSecretKey) as AuthorizationWithLegacy;
    return [true, translateAuthorization(payload)];
  } catch (error) {
    logger.warn({ authorizationToken, error }, `Invalid JWT`);
    return [false, undefined];
  }
}

function translateAuthorization({
  name,
  email,
  application,
  applications,
}: AuthorizationWithLegacy): Authorization {
  return {
    name,
    email,
    application: application ?? (applications ?? [])[0] ?? "",
  };
}

interface AuthorizerContext {
  [key: string]: string;
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
      ? // Sadly, TypeScript doesn't support to cast from Authorization to {[key: string]: string}.
        ((translateAuthorization(context) as unknown) as AuthorizerContext)
      : null,
  };
  logger.info({ policy, token }, `auth`);

  await logger.flushSlack();
  return policy;
};
