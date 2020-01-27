import { CustomAuthorizerResult } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { decodeJWT, handle } from "../src/auth";
import IAuthorization from "../src/model/authorization";
import env from "../src/model/env";

const newJWT = (payload: IAuthorization) => jwt.sign(payload, env.jwtSecretKey);

test("pass-token", () => {
  const input = `Bearer ${newJWT({
    name: "tester",
    email: "unknown@domain.com",
    applications: ["test-app"]
  })}`;
  const [allow, payload] = decodeJWT(input);
  console.log(allow, payload);
  expect(allow).toBeTruthy();
  expect(payload).toBeDefined();
});

test("pass-handle", async () => {
  const input = `Bearer ${newJWT({
    name: "tester",
    email: "unknown@domain.com",
    applications: ["test-app"]
  })}`;

  const policy = (await handle(
    {
      authorizationToken: input,
      methodArn:
        "arn:aws:lambda:ap-northeast-2:000000000000:function:yyt-lobby-awesome"
    } as any,
    {} as any,
    () => 0
  )) as CustomAuthorizerResult;
  console.log(JSON.stringify(policy, null, 2));
  expect(policy).toBeDefined();
  expect(policy.policyDocument.Statement[0]).toBeDefined();
  expect(policy.policyDocument.Statement[0].Effect).toEqual("Allow");
});
