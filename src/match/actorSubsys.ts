import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queuePush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import mem from "mem";
import getRedis from "./getRedis";
import logger from "./logger";

function newActorSubsys() {
  const connection = getRedis();
  return {
    logger,
    awaiter: {
      ...awaiterWait({ connection, logger }),
      ...awaiterResolve({ connection, logger })
    },
    queue: {
      ...queueSize({ connection, logger }),
      ...queuePush({ connection, logger }),
      ...queueFlush({ connection, logger })
    },
    lock: {
      ...lockAcquire({ connection, logger }),
      ...lockRelease({ connection, logger })
    }
  };
}
export default mem(newActorSubsys);
