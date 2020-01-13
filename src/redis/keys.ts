const keyPrefix = `lobby`;

export default {
  user: (connectionId: string) => `${keyPrefix}/user/${connectionId}`,
  matchingPool: (applicationId: string) =>
    `${keyPrefix}/matchingPool/${applicationId}`,
  matchingTime: (applicationId: string, connectionId: string) =>
    `${keyPrefix}/matchingTime/${applicationId}/${connectionId}`
};
