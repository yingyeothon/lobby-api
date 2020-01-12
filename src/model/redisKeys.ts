const keyPrefix = `lobby`;

export default {
  user: (connectionId: string) => `${keyPrefix}/user/${connectionId}`,
  matchingPool: (applicationId: string) =>
    `${keyPrefix}/matchingPool/${applicationId}`,
  chatingPool: (applicationId: string) =>
    `${keyPrefix}/chatingPool/${applicationId}`
};
