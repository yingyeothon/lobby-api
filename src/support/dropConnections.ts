import dropConnection from "./dropConnection";
import logger from "./logger";
import {
  allOrNoneForSuccessMap,
  SuccessRow,
  successRowAsMap
} from "./successMap";

export default async function dropConnections(connectionIds: string[]) {
  try {
    const rows = await Promise.all(
      connectionIds.map(async connectionId => {
        try {
          await dropConnection(connectionId);
          return [connectionId, true] as SuccessRow;
        } catch (error) {
          logger.error(`Cannot drop the connection`, connectionId, error);
          return [connectionId, false] as SuccessRow;
        }
      })
    );
    return successRowAsMap(rows);
  } catch (error) {
    logger.error(`Something wrong with dropConnections`, error);
    return allOrNoneForSuccessMap(connectionIds, false);
  }
}
