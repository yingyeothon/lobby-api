export type SuccessRow = [string, boolean];

export interface SuccessMap {
  [connectionId: string]: boolean;
}

export function successRowAsMap(rows: SuccessRow[]): SuccessMap {
  return rows.reduce(
    (obj, [id, success]) => Object.assign(obj, { [id]: success }),
    {} as SuccessMap
  );
}

export function allOrNoneForSuccessMap(
  connectionIds: string[],
  success: boolean
): SuccessMap {
  return connectionIds.reduce(
    (obj, id) => Object.assign(obj, { [id]: success }),
    {} as SuccessMap
  );
}
