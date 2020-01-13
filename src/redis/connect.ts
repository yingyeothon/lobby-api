import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import env from "../model/env";

export default function connect() {
  return redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });
}
