export default interface StateManager {
  get: (key: string) => Promise<string | null>;
  del: (...keys: string[]) => Promise<number>;
  srem: (key: string, ...values: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
}
