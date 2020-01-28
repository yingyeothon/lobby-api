import { CustomAuthorizerHandler } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import logger from "./logger";
import IAuthorization from "./model/authorization";
import env from "./model/env";

const jwtSecretKey = env.jwtSecretKey;

export function decodeJWT(
  authorizationToken: string | undefined
): [boolean, IAuthorization | undefined] {
  const token = (authorizationToken ?? "").trim();
  if (token.length === 0) {
    return [false, undefined];
  }
  try {
    const payload = jwt.verify(token, jwtSecretKey) as IAuthorization;
    return [true, payload];
  } catch (error) {
    logger.info(`Invalid JWT`, authorizationToken, error);
    return [false, undefined];
  }
}

export const handle: CustomAuthorizerHandler = async event => {
  const [allow, context] = decodeJWT(
    (event.queryStringParameters ?? {}).authorization
  );
  const policy = {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: event.methodArn
        }
      ]
    },
    context
  };
  logger.debug(
    `auth`,
    event.queryStringParameters,
    JSON.stringify(policy, null, 2)
  );
  return policy;
};
