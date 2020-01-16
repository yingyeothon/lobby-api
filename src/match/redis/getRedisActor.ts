import { bulkConsumer } from "@yingyeothon/actor-system/lib/actor/env/consumeType";
import { ActorSendEnvironment } from "@yingyeothon/actor-system/lib/actor/send";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import mem from "mem";
import apps from "../../data/applications";
import dropConnections from "../../support/dropConnections";
import postMessage from "../../support/postMessage";
import processMessage from "../actor/processMessage";
import getRedis from "./getRedis";
import getRedisSubsys from "./getRedisSubsys";

function newRedisActor(id: string): ActorSendEnvironment<{}> {
  const redis = getRedis();
  const subsys = getRedisSubsys();
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

export default mem(newRedisActor);
