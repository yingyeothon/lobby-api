import asYlogger from "@yingyeothon/slack-logger/lib/asYlogger";
import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import { getLogger } from "@yingyeothon/slack-logger";
import getRedis from "./getRedis";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import mem from "mem";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queuePush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import subsysPrefix from "./subsysPrefix";

const logger = getLogger("newRedisActorSubsystem", __filename);

function newRedisActorSubsystem() {
  const connection = getRedis();
  const yLogger = asYlogger(logger);
  return {
    logger: yLogger,
    awaiter: {
      ...awaiterWait({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorAwaiter,
      }),
      ...awaiterResolve({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorAwaiter,
      }),
    },
    queue: {
      ...queueSize({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorQueue,
      }),
      ...queuePush({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorQueue,
      }),
      ...queueFlush({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorQueue,
      }),
    },
    lock: {
      ...lockAcquire({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorLock,
      }),
      ...lockRelease({
        connection,
        logger: yLogger,
        keyPrefix: subsysPrefix.actorLock,
      }),
    },
  };
}
export default mem(newRedisActorSubsystem);
