import { ConsoleLogger } from "@yingyeothon/logger";
import { Lambda } from "aws-sdk";
import env from "../../model/env";
import { IGameInvokeArguments } from "../actor/invokeNewGame";

const logger = new ConsoleLogger(`debug`);

export default function invokeGameLambda({
  awaiter
}: {
  awaiter: (applicationId: string, gameId: string) => Promise<boolean>;
}) {
  return async (args: IGameInvokeArguments): Promise<boolean> => {
    const { app, gameId } = args;
    if (app.functionName === undefined) {
      return true;
    }
    const invoked = await new Lambda({
      endpoint: env.isOffline ? `http://localhost:3000` : undefined
    })
      .invoke({
        FunctionName: app.functionName,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify({
          args
        })
      })
      .promise();

    logger.debug("Lambda invoked", invoked);

    const awaited = await awaiter(app.id, gameId);
    logger.debug("Game awaited", awaited);
    return awaited;
  };
}
