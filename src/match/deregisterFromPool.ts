import IUser from "../model/user";
import redisKeys from "../redis/keys";

interface IDeregisterEnvironment {
  user: IUser;
  srem: (key: string, value: string) => Promise<any>;
  del: (key: string) => Promise<any>;
}

export default async function deregisterFromPool({
  user,
  srem,
  del
}: IDeregisterEnvironment) {
  const { connectionId } = user;
  return Promise.all([
    ...user.applications.map(appId =>
      srem(redisKeys.matchingPool(appId), connectionId)
    ),
    ...user.applications.map(appId =>
      del(redisKeys.matchingTime(appId, connectionId))
    )
  ]);
}
