import { Lambda } from "aws-sdk";
import IApplication from "../../model/application";
import env from "../../model/env";

export default async function invokeGameLambda(
  app: IApplication,
  gameId: string,
  members: string[]
) {
  return new Lambda({
    endpoint: env.isOffline ? `http://localhost:3000` : undefined
  })
    .invoke({
      FunctionName: app.functionName,
      InvocationType: "Event",
      Qualifier: "$LATEST",
      Payload: JSON.stringify({
        gameId,
        members
      })
    })
    .promise();
}
