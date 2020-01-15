import AwaitPolicy from "@yingyeothon/actor-system/lib/actor/message/awaitPolicy";
import actorSend from "@yingyeothon/actor-system/lib/actor/send";
import getActor from "./actor/actor";

export default async function requestMatch(applicationId: string) {
  return actorSend(getActor(applicationId), {
    item: { tick: Date.now() },
    awaitPolicy: AwaitPolicy.Commit
  });
}
