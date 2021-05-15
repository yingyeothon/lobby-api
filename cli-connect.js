/**
 * This example simply shows how to make a connection with game server via lobby api.
 * Please use this script with
 *   - "application" which is registered in "APPS_OBJECT_KEY" file in "CONFIG_BUCKET".
 *   - "auth-api-url" which is deployed "auth-api" server.
 *
 * For example, we can run this script like this.
 *   $ node cli-connect.js "awesome-application-id" "https://auth.api.url"
 */
const fetch = require("node-fetch");
const WebSocket = require("ws");
const readline = require("readline");

async function main() {
  const application = process.argv[2];
  const authApiUrl = process.argv[3];
  if (!application || !authApiUrl) {
    console.info(
      `${process.argv[0]} ${process.argv[1]} application auth-api-url`
    );
    return;
  }
  console.debug({ stage: process.env.STAGE });

  const name = "test" + Math.ceil(Math.random() * 100);
  console.debug({ application, authApiUrl, name });

  // Step 1. Get authorization from auth-api.
  const authorization = await fetch(authApiUrl, {
    method: "POST",
    body: JSON.stringify({
      name,
      email: `${name}@gmail.com`,
      application,
    }),
  }).then((r) => r.text());
  console.debug({ authorization });

  // Step 2. Connect to lobby api with authorization.
  const lobbyUrl = `wss://${process.env.WS_ENDPOINT}?authorization=${authorization}`;
  console.debug({ lobbyUrl });
  const matchResponse = await new Promise((resolve, reject) => {
    const lobbySocket = new WebSocket(lobbyUrl)
      .on("open", () => {
        // Step 3. Send "match" request after connected.
        const matchRequest = { type: "match", application };
        console.debug({ matchRequest });
        lobbySocket.send(JSON.stringify(matchRequest));
      })
      .on("message", (data) => resolve(JSON.parse(data)))
      .on("error", reject);
  });
  console.debug({ matchResponse });

  // Step 4. If matched, connect to game server.
  const { gameId, playerId } = matchResponse;
  const gameUrl = `${matchResponse.url}?x-game-id=${gameId}&x-member-id=${playerId}`;
  console.debug({ gameId, playerId, gameUrl });
  const game = new WebSocket(gameUrl)
    .on("open", () => console.info("Connected."))
    .on("close", () => {
      console.info("Disconnected.");
      process.exit();
    })
    .on("error", (error) => console.error({ error }, "Error occurred"))
    // Print all messages from game server.
    // It will break your cursor at console.
    .on("message", (data) => console.info({ data }, "Data received"));

  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    // Send messages from console to game server.
    .on("line", (line) => game.send(line))
    .on("close", () => process.exit());
}
main().catch(console.error);
