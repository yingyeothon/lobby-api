import { GameInvokeArguments } from "../actor/invokeNewGame";
import { Lambda } from "aws-sdk";
import env from "../../model/env";
import { getLogger } from "@yingyeothon/slack-logger";

const logger = getLogger("invokeGameLambda", __filename);

export default function invokeGameLambda({
  awaiter,
}: {
  awaiter: (applicationId: string, gameId: string) => Promise<boolean>;
}) {
  return async (args: GameInvokeArguments): Promise<boolean> => {
    const { app, gameId } = args;
    if (app.functionName === undefined) {
      return true;
    }
    const invoked = await new Lambda({
      endpoint: env.isOffline ? `http://localhost:3000` : undefined,
    })
      .invoke({
        FunctionName: app.functionName,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify(args),
      })
      .promise();

    logger.debug({ invoked }, "Lambda invoked");

    const awaited = await awaiter(app.id, gameId);
    logger.debug({ awaited }, "Game awaited");
    return awaited;
  };
}
