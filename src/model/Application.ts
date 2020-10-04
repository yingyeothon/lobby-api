export default interface Application {
  id: string;
  url: string;

  // For testing purpose, it can be omitted.
  functionName?: string;
  memberCount: number;

  incompletedMatchingWaitMillis?: number;
  maxWaitingMillis?: number;
}
