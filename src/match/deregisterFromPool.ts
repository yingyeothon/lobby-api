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
    srem(redisKeys.matchingPool(user.application), connectionId),
    del(redisKeys.matchingTime(user.application, connectionId)),
  ]);
}
