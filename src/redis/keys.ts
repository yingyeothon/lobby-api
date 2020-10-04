const keyPrefix = `lobby`;

export default {
  user: (connectionId: string): string => `${keyPrefix}/user/${connectionId}`,
  matchingPool: (applicationId: string): string =>
    `${keyPrefix}/matchingPool/${applicationId}`,
  matchingTime: (applicationId: string, connectionId: string): string =>
    `${keyPrefix}/matchingTime/${applicationId}/${connectionId}`,
};
