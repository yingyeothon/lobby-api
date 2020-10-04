import AwaitPolicy from "@yingyeothon/actor-system/lib/actor/message/awaitPolicy";
import actorSend from "@yingyeothon/actor-system/lib/actor/send";
import getRedisActorEnvironment from "./getRedisActorEnvironment";

export default async function requestMatch(
  applicationId: string
): Promise<boolean> {
  const actorEnv = await getRedisActorEnvironment(applicationId);
  return actorSend(actorEnv, {
    item: { tick: Date.now() },
    awaitPolicy: AwaitPolicy.Commit,
  });
}
