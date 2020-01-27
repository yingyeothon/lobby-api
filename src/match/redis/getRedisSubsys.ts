import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queuePush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import mem from "mem";
import logger from "../../logger";
import getRedis from "./getRedis";
import subsysPrefix from "./subsysPrefix";

function newRedisActorSubsystem() {
  const connection = getRedis();
  return {
    logger,
    awaiter: {
      ...awaiterWait({
        connection,
        logger,
        keyPrefix: subsysPrefix.actorAwaiter
      }),
      ...awaiterResolve({
        connection,
        logger,
        keyPrefix: subsysPrefix.actorAwaiter
      })
    },
    queue: {
      ...queueSize({ connection, logger, keyPrefix: subsysPrefix.actorQueue }),
      ...queuePush({ connection, logger, keyPrefix: subsysPrefix.actorQueue }),
      ...queueFlush({ connection, logger, keyPrefix: subsysPrefix.actorQueue })
    },
    lock: {
      ...lockAcquire({ connection, logger, keyPrefix: subsysPrefix.actorLock }),
      ...lockRelease({ connection, logger, keyPrefix: subsysPrefix.actorLock })
    }
  };
}
export default mem(newRedisActorSubsystem);
