import { CustomAuthorizerHandler } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import logger from "./logger";
import IAuthorization from "./model/authorization";
import env from "./model/env";

const jwtSecretKey = env.jwtSecretKey;

export function decodeJWT(
  authorizationToken: string | undefined
): [boolean, IAuthorization | undefined] {
  const [type, token] = (authorizationToken ?? "").split(/\s+/);
  if (type !== "Bearer" || token?.length === 0) {
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

function buildScopedMethodArn(methodArn: string) {
  // arn:aws:execute-api:region:account-id:api-id/stage-name/$connect
  const [, , , region, accountId, apiId, stage] = methodArn.split(/[:/]/);
  const scopedMethodArn =
    ["arn", "aws", "execute-api", region, accountId, apiId].join(":") +
    "/" +
    [stage, /* route= */ "*"].join("/");
  return scopedMethodArn;
}

export const handle: CustomAuthorizerHandler = async event => {
  const [allow, context] = decodeJWT(event.authorizationToken);
  const policy = {
    principalId: "lobby-user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: buildScopedMethodArn(event.methodArn)
        }
      ]
    },
    context
  };
  logger.debug(
    `auth`,
    event.authorizationToken,
    JSON.stringify(policy, null, 2)
  );
  return policy;
};
