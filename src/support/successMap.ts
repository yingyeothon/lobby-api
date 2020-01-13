export type SuccessRow = [string, boolean];

export interface ISuccessMap {
  [connectionId: string]: boolean;
}

export function successRowAsMap(rows: SuccessRow[]): ISuccessMap {
  return rows.reduce(
    (obj, [id, success]) => Object.assign(obj, { [id]: success }),
    {} as ISuccessMap
  );
}

export function allOrNoneForSuccessMap(
  connectionIds: string[],
  success: boolean
): ISuccessMap {
  return connectionIds.reduce(
    (obj, id) => Object.assign(obj, { [id]: success }),
    {} as ISuccessMap
  );
}
