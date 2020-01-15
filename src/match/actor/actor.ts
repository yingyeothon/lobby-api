import { bulkConsumer } from "@yingyeothon/actor-system/lib/actor/env/consumeType";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import mem from "mem";
import apps from "../../data/applications";
import dropConnections from "../../support/dropConnections";
import postMessage from "../../support/postMessage";
import getRedis from "../getRedis";
import processMessage from "./processMessage";
import getSubsys from "./subsys";

function newActor(id: string) {
  const redis = getRedis();
  const subsys = getSubsys();
  return {
    id,
    ...subsys,
    ...bulkConsumer,
    onMessages: processMessage({
      // Properties
      id,
      app: apps.find(app => app.id === id)!,

      // State manager
      smembers: key => redisSmembers(redis, key),
      get: (key: string) => redisGet(redis, key),
      srem: (key: string, ...values: string[]) =>
        redisSrem(redis, key, ...values),
      del: (...keys: string[]) => redisDel(redis, ...keys),

      // Message exchanger
      dropConnections,
      postMessage
    })
  };
}

export default mem(newActor);
