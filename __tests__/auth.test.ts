import * as jwt from "jsonwebtoken";

import { decodeJWT, handle } from "../src/auth";

import Authorization from "../src/model/Authorization";
import { CustomAuthorizerResult } from "aws-lambda";
import env from "../src/model/env";

const newJWT = (payload: Authorization) => jwt.sign(payload, env.jwtSecretKey);

test("pass-token", () => {
  const input = newJWT({
    name: "tester",
    email: "unknown@domain.com",
    applications: ["test-app"],
  });
  const [allow, payload] = decodeJWT(input);
  console.log(allow, payload);
  expect(allow).toBeTruthy();
  expect(payload).toBeDefined();
});

test("pass-handle", async () => {
  const input = newJWT({
    name: "tester",
    email: "unknown@domain.com",
    applications: ["test-app"],
  });

  const policy = (await handle(
    {
      type: "TOKEN",
      authorizationToken: input,
      methodArn:
        "arn:aws:lambda:ap-northeast-2:000000000000:function:yyt-lobby-awesome",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as any,
    () => 0
  )) as CustomAuthorizerResult;
  console.log(JSON.stringify(policy, null, 2));
  expect(policy).toBeDefined();
  expect(policy.policyDocument.Statement[0]).toBeDefined();
  expect(policy.policyDocument.Statement[0].Effect).toEqual("Allow");
});
