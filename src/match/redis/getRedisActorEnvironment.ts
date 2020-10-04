import { ActorSendEnvironment } from "@yingyeothon/actor-system/lib/actor/send";
import { bulkConsumer } from "@yingyeothon/actor-system/lib/actor/env/consumeType";
import dropConnections from "../../support/dropConnections";
import { getApp } from "../../data/apps";
import getRedis from "./getRedis";
import getRedisSubsys from "./getRedisSubsys";
import getUser from "../../redis/user/getUser";
import invokeGameLambda from "../lambda/lambdaGameInvoker";
import pMem from "p-memoize";
import postMessage from "../../support/postMessage";
import processMessage from "../actor/processMessage";
import redisAwaiter from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSmembers from "@yingyeothon/naive-redis/lib/smembers";
import redisSrem from "@yingyeothon/naive-redis/lib/srem";
import subsysPrefix from "./subsysPrefix";

const gameInvokerMaxWaitMillis = 3 * 1000;

async function newRedisActorEnvironment(
  id: string
): Promise<ActorSendEnvironment<unknown>> {
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
      smembers: (key) => redisSmembers(redis, key),
      get: (key: string) => redisGet(redis, key),
      srem: (key: string, ...values: string[]) =>
        redisSrem(redis, key, ...values),
      del: (...keys: string[]) => redisDel(redis, ...keys),

      getUser: (connectionId: string) => getUser(redis, connectionId),

      // Message exchanger
      dropConnections,
      postMessage,

      // GameInvoker
      invoker: invokeGameLambda({
        awaiter: async (appId, gameId) =>
          redisAwaiter({
            connection: redis,
            keyPrefix: subsysPrefix.invokerAwaiter,
            logger: subsys.logger,
          }).wait(appId, gameId, gameInvokerMaxWaitMillis),
      }),
    }),
  };
}

export default pMem(newRedisActorEnvironment);
