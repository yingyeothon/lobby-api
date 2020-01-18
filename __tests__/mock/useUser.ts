import IUser from "../../src/model/user";
import redisKeys from "../../src/redis/keys";

export default function useUser({
  get,
  set
}: {
  get: (key: string) => Promise<string>;
  set: (key: string, value: string) => Promise<any>;
}) {
  async function getUser(connectionId: string): Promise<IUser> {
    const user = await get(redisKeys.user(connectionId));
    return JSON.parse(user);
  }
  async function setUser(user: IUser): Promise<boolean> {
    await set(redisKeys.user(user.connectionId), JSON.stringify(user));
    return true;
  }
  return { getUser, setUser };
}
