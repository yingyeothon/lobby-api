import processMessage from "../../src/match/actor/processMessage";
import registerToPool from "../../src/match/registerToPool";
import IApplication from "../../src/model/application";
import MockExchange from "./mockExchange";
import useGameInvoker from "./mockGameInvoker";
import MockRedis from "./mockRedis";

const app: IApplication = {
  id: `test-app-id`,
  url: `wss://test-app-url`,
  functionName: `arn:test-game-lambda`,
  memberCount: 2
};
const newUser = (index: number) => ({
  name: `test-${index}`,
  connectionId: `test-connection-${index}`,
  email: `unknown-${index}@doma.in`,
  applications: [app.id]
});

test("simple", async () => {
  const mockRedis = new MockRedis();
  const mockExchange = new MockExchange();
  const user1 = newUser(1);
  const user2 = newUser(2);
  const [invoked, invoker] = useGameInvoker();

  await registerToPool({
    applicationId: app.id,
    user: user1,
    ...mockRedis
  });
  expect(mockExchange.postbox.length).toEqual(0);
  expect(mockExchange.dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  const matcher = processMessage({
    app,
    id: app.id,
    ...mockRedis,
    ...mockExchange,
    invoker
  });
  await matcher();
  expect(mockExchange.postbox.length).toEqual(0);
  expect(mockExchange.dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  await registerToPool({
    applicationId: app.id,
    user: user2,
    ...mockRedis
  });
  expect(mockExchange.postbox.length).toEqual(0);
  expect(mockExchange.dropped.length).toEqual(0);
  expect(invoked.length).toEqual(0);

  await matcher();
  expect(mockExchange.postbox.length).toEqual(2);
  expect(mockExchange.dropped.length).toEqual(2);
  expect(invoked.length).toEqual(1);
});
