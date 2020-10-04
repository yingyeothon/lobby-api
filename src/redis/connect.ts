import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import env from "../model/env";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";

export default function connect(): RedisConnection {
  return redisConnect({
    host: env.redisHost,
    password: env.redisPassword,
  });
}
