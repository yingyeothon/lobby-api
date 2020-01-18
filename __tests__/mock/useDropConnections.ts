import { allOrNoneForSuccessMap } from "../../src/support/successMap";

function dropConnections(dropped: string[]) {
  return async (connectionIds: string[]) => {
    dropped.push(...connectionIds);
    return allOrNoneForSuccessMap(connectionIds, true);
  };
}

export default function useDropConnections(): [
  string[],
  ReturnType<typeof dropConnections>
] {
  const dropped: string[] = [];
  return [dropped, dropConnections(dropped)];
}
