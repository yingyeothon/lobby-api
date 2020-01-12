import { CustomAuthorizerHandler } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import IAuthorization from "./model/authorization";
import env from "./model/env";

const jwtSecretKey = env.jwtSecretKey;

export const handle: CustomAuthorizerHandler = async event => {
  const [type, token] = (event.authorizationToken || "").split(/\s+/);
  const allow = type === "Bearer" && jwt.verify(token, jwtSecretKey);

  const [, , , region, accountId, apiId, stage] = event.methodArn.split(/[:/]/);
  const scopedMethodArn =
    ["arn", "aws", "execute-api", region, accountId, apiId].join(":") +
    "/" +
    [stage, /* method= */ "*", /* function= */ "*"].join("/");
  const context = allow ? (jwt.decode(token) as IAuthorization) : undefined;
  return {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: scopedMethodArn
        }
      ]
    },
    context
  };
};
