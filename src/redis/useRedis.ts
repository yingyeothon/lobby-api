import { IRedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import connect from "./connect";

export default async function useRedis<R>(
  connectionWork: (connection: IRedisConnection) => Promise<R>
) {
  const connection = connect();
  try {
    const result = await connectionWork(connection);
    return result;
  } finally {
    connection.socket.disconnect();
  }
}
