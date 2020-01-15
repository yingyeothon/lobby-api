import { Lambda } from "aws-sdk";
import env from "../../model/env";
import IMatchProperty from "./env/property";
import logger from "./logger";

export type InvokeEnvironment = Pick<IMatchProperty, "app">;

export default function invokeNewGame({ app }: InvokeEnvironment) {
  return async (gameId: string, playerIds: string[]) => {
    const invoked = await new Lambda({
      endpoint: env.isOffline ? `http://localhost:3000` : undefined
    })
      .invoke({
        FunctionName: app.functionName,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify({
          gameId,
          members: playerIds
        })
      })
      .promise();
    logger.info(`Start new game actor`, invoked);
  };
}
