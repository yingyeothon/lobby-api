export default interface IApplication {
  id: string;
  url: string;
  functionName: string;
  memberCount: number;

  incompletedMatchingWaitMillis?: number;
  maxWaitingMillis?: number;
}
