import AwaitPolicy from "@yingyeothon/actor-system/lib/actor/message/awaitPolicy";
import actorSend from "@yingyeothon/actor-system/lib/actor/send";
import getActorSubsys from "./actorSubsys";
import MatchingActor from "./matchingActor";

export default async function requestMatch(applicationId: string) {
  const actorSubsys = getActorSubsys();
  return actorSend(
    {
      _consume: "bulk",
      ...actorSubsys,
      ...new MatchingActor(applicationId)
    },
    { item: { tick: Date.now() }, awaitPolicy: AwaitPolicy.Commit }
  );
}
