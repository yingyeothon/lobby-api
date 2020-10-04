import User from "../model/User";
import redisKeys from "../redis/keys";

interface DeregisterEnvironment {
  user: User;
  srem: (key: string, value: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
}

export default async function deregisterFromPool({
  user,
  srem,
  del,
}: DeregisterEnvironment): Promise<unknown> {
  const { connectionId } = user;
  return Promise.all([
    ...user.applications.map((appId) =>
      srem(redisKeys.matchingPool(appId), connectionId)
    ),
    ...user.applications.map((appId) =>
      del(redisKeys.matchingTime(appId, connectionId))
    ),
  ]);
}
