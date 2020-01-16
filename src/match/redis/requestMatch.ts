import AwaitPolicy from "@yingyeothon/actor-system/lib/actor/message/awaitPolicy";
import actorSend from "@yingyeothon/actor-system/lib/actor/send";
import getRedisActor from "./getRedisActor";

export default async function requestMatch(applicationId: string) {
  return actorSend(getRedisActor(applicationId), {
    item: { tick: Date.now() },
    awaitPolicy: AwaitPolicy.Commit
  });
}
