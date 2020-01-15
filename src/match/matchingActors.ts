import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import apps from "../data/applications";
import dropConnections from "../support/dropConnections";
import postMessage from "../support/postMessage";
import getRedis from "./getRedis";
import { IMatchingActor } from "./matchingActor";

export const createMatchingActor = (id: string) : IMatchingActor => {
  const redis = getRedis();
  return ({
    id,
    app: apps.find(app => app.id === id)!,
    smembers: (key) => redisSmembers(redis, key),
    get: (key: string) => redisGet(redis, key),
    srem: (key: string, ...values: string[]) => redisSrem(redis, key, ...values),
    del: (...keys: string[]) => redisDel(redis, ...keys),
    dropConnections,
    postMessage,
  });
};
