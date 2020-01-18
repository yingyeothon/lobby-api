import { bulkConsumer } from "@yingyeothon/actor-system/lib/actor/env/consumeType";
import { ActorSendEnvironment } from "@yingyeothon/actor-system/lib/actor/send";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import pMem from "p-memoize";
import { getApp } from "../../data/apps";
import getUser from "../../redis/user/getUser";
import dropConnections from "../../support/dropConnections";
import postMessage from "../../support/postMessage";
import processMessage from "../actor/processMessage";
import invokeGameLambda from "../lambda/lambdaGameInvoker";
import getRedis from "./getRedis";
import getRedisSubsys from "./getRedisSubsys";

async function newRedisActorEnvironment(
  id: string
): Promise<ActorSendEnvironment<{}>> {
  const app = await getApp(id);
  const redis = getRedis();
  const subsys = getRedisSubsys();

  return {
    id,
    ...subsys,
    ...bulkConsumer,
    onMessages: processMessage({
      // Properties
      id,
      app,

      // State manager
      smembers: key => redisSmembers(redis, key),
      get: (key: string) => redisGet(redis, key),
      srem: (key: string, ...values: string[]) =>
        redisSrem(redis, key, ...values),
      del: (...keys: string[]) => redisDel(redis, ...keys),

      getUser: (connectionId: string) => getUser(redis, connectionId),

      // Message exchanger
      dropConnections,
      postMessage,

      // GameInvoker
      invoker: invokeGameLambda
    })
  };
}

export default pMem(newRedisActorEnvironment);
