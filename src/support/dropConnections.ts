import {
  SuccessMap,
  SuccessRow,
  allOrNoneForSuccessMap,
  successRowAsMap,
} from "./successMap";

import dropConnection from "./dropConnection";
import { getLogger } from "@yingyeothon/slack-logger";

const logger = getLogger("dropConnections", __filename);

export default async function dropConnections(
  connectionIds: string[]
): Promise<SuccessMap> {
  try {
    const rows = await Promise.all(
      connectionIds.map(async (connectionId) => {
        try {
          await dropConnection(connectionId);
          return [connectionId, true] as SuccessRow;
        } catch (error) {
          (/GoneException/.test(error.name) ? logger.debug : logger.error)(
            { connectionId, error },
            `Cannot drop the connection`
          );
          return [connectionId, false] as SuccessRow;
        }
      })
    );
    return successRowAsMap(rows);
  } catch (error) {
    logger.error({ error }, `Something wrong with dropConnections`);
    return allOrNoneForSuccessMap(connectionIds, false);
  }
}
