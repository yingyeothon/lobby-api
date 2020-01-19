import { CustomAuthorizerResult } from "aws-lambda";
import { decodeJWT, handle } from "../src/auth";

test("pass-token", () => {
  const input =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibGFjdGkiLCJlbWFpbCI6InVua25vd25AZW1haWwuYWRkcmVzcyIsImFwcGxpY2F0aW9ucyI6WyJhYmMiXSwiaWF0IjoxNTc5NDAxMjgzLCJleHAiOjE1Nzk0MDQ4ODN9.noJemkLqPW4zB4kD_tWB60c_Hu83WUyRaA1e66XE-dg";
  const [allow, payload] = decodeJWT(input);
  console.log(allow, payload);
  expect(allow).toBeTruthy();
  expect(payload).toBeDefined();
});

test("pass-handle", async () => {
  const input =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibGFjdGkiLCJlbWFpbCI6InVua25vd25AZW1haWwuYWRkcmVzcyIsImFwcGxpY2F0aW9ucyI6WyJhYmMiXSwiaWF0IjoxNTc5NDAxMjgzLCJleHAiOjE1Nzk0MDQ4ODN9.noJemkLqPW4zB4kD_tWB60c_Hu83WUyRaA1e66XE-dg";

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
