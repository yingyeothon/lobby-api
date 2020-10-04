import Application from "../../src/model/Application";
import MockRedis from "../mock/mockRedis";
import User from "../../src/model/User";
import { flushSlack } from "@yingyeothon/slack-logger";
import processMessage from "../../src/match/actor/processMessage";
import registerToPool from "../../src/match/registerToPool";
import useDropConnections from "../mock/useDropConnections";
import useGameInvoker from "../mock/useGameInvoker";
import usePostMessage from "../mock/usePostMessage";
import useUser from "../mock/useUser";

const app: Application = {
  id: `test-app-id`,
  url: `wss://test-app-url`,
  functionName: `arn:test-game-lambda`,
  memberCount: 2,
};
const newUser = (index: number): User => ({
  name: `test-${index}`,
  connectionId: `test-connection-${index}`,
  email: `unknown-${index}@doma.in`,
  applications: [app.id],
  userId: `user-${index}`,
});

test("simple", async () => {
  const mockRedis = new MockRedis();
  const user1 = newUser(1);
  const user2 = newUser(2);
  const [invoked, invoker] = useGameInvoker();
  const [postbox, postMessage] = usePostMessage();
  const [dropped, dropConnections] = useDropConnections();
  const { getUser, setUser } = useUser(mockRedis);
  await setUser(user1);
  await setUser(user2);

  await registerToPool({
    applicationId: app.id,
    user: user1,
    ...mockRedis,
  });
  expect(postbox.length).toEqual(0);
  expect(dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  const matcher = processMessage({
    app,
    id: app.id,
    ...mockRedis,
    postMessage,
    dropConnections,
    invoker,
    getUser,
  });
  await matcher();
  expect(postbox.length).toEqual(0);
  expect(dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  await registerToPool({
    applicationId: app.id,
    user: user2,
    ...mockRedis,
  });
  expect(postbox.length).toEqual(0);
  expect(dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  await matcher();
  expect(postbox.length).toEqual(2);
  expect(dropped.length).toEqual(2);
  expect(invoked.length).toEqual(1);

  console.log(`postbox`, postbox);
  console.log(`dropped`, dropped);
  console.log(`invoked`, invoked);

  await flushSlack();
});
