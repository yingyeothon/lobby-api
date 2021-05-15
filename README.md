# Lobby API

A simple matching server API.

## Development

```bash
yarn
yarn deploy
```

### Environment

- `STAGE`
- `REDIS_HOST`
- `REDIS_PASSWORD`
- `WS_ENDPOINT`
- `CALLBACK_URL_PREFIX`
- `JWT_SECRET_KEY`
- `CONFIG_BUCKET`
- `APPS_OBJECT_KEY`
- `SLACK_WEBHOOK_URL`
- `SLACK_CHANNEL`
- `SLACK_LOG_LEVEL`
- `CONSOLE_LOG_LEVEL`

### `envrc` example

```bash
# Staging settings
export STAGE="${STAGE:-"dev"}"

# Infrastructure settings
export REDIS_HOST="redis-host"
export REDIS_PASSWORD="redis-password"

# Messaging settings
export WS_ENDPOINT="web.socket.endpoint/example"
export CALLBACK_URL_PREFIX="https://callback-url.api.tld/lobby/invoked"

# Authentication settings
export JWT_SECRET_KEY="jwt-secret-key-which-is-same-with-auth-api"

# Configuration settings
export CONFIG_BUCKET="lobby-config-bucket-example"
export APPS_OBJECT_KEY="lobby-apps-object-example"

# Logger settings
# export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX"
# export SLACK_CHANNEL="CXXXXXXXXX"
# export SLACK_LOG_LEVEL="warn"
# export CONSOLE_LOG_LEVEL="trace"
```

## Quick start

To authenticate, we should deploy [auth-api](https://github.com/yingyeothon/auth-api) first.

1. Get `authorization` token from `auth-api` using `application(game-id)`.
2. Connect to `lobby-api` with `authorization`.
3. Send `match` message.
4. After matched, it received matched messsage like this.
5. Or, its connection is dropped.

For example, `application` is `ca9a2697-229f-4569-a282-1044f3037a86` then,

```bash
# Step 1. Get authorization token.
$ curl -XPOST https://auth.api.url/simple -d '{"name":"lacti","email":"lactrious@gmail.com","application":"ca9a2697-229f-4569-a282-1044f3037a86"}'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibGFjdGkiLCJlbWFpbCI6ImxhY3RyaW91c0BnbWFpbC5jb20iLCJhcHBsaWNhdGlvbiI6ImNhOWEyNjk3LTIyOWYtNDU2OS1hMjgyLTEwNDRmMzAzN2E4NiIsImlhdCI6MTYyMTA2MTkxMiwiZXhwIjoxNjIxMDY1NTEyfQ.SECRET_ENCODED

# Step 2. Connect lobby-api with authorization query parameter.
$ yarn wscat -c "wss://lobby.websocket.url/?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibGFjdGkiLCJlbWFpbCI6ImxhY3RyaW91c0BnbWFpbC5jb20iLCJhcHBsaWNhdGlvbiI6ImNhOWEyNjk3LTIyOWYtNDU2OS1hMjgyLTEwNDRmMzAzN2E4NiIsImlhdCI6MTYyMTA2MTkxMiwiZXhwIjoxNjIxMDY1NTEyfQ.SECRET_ENCODED"

Connected (press CTRL+C to quit)
# Step 3. Send "match" message.
> {"type":"match","application":"ca9a2697-229f-4569-a282-1044f3037a86"}

# Step 4. Receive "matched" message if matching is completed.
< {"type":"match","url":"wss://game.websocket.url/","gameId":"3d73ccc8-b755-418f-8b78-f4badfc9c4b4","playerId":"c4409ca4-58a5-41dc-a5cf-433bd58778a0"}

# Step 4-1. And then, lobby server disconnects this connection.
Disconnected (code: 1000, reason: "Connection Closed Normally")

# Step 5. Or, there are no matchable other users, disconnects this connection after about `maxWaitingMillis` milliseconds.
Disconnected (code: 1000, reason: "Connection Closed Normally")
```

## Server list

We can manage `Server list` using [`manage-apps.sh`](manage-apps.sh) script. We can write a server list file which its name is `APPS_OBJECT_KEY`. For example, `APPS_OBJECT_KEY` is `server-list`, the result of `cat "server-list"` is like this.

```json
{
  "very-complex-id-like-uuid": {
    "id": "very-complex-id-like-uuid",
    "url": "wss://game.websocket.url",
    "functionName": "arn:aws:lambda:AWS_REGION:AWS_ACCOUNT_ID:function:GAME_LAMBDA_FUNCTION_NAME",
    "memberCount": 2,
    "incompletedMatchingWaitMillis": 10000,
    "maxWaitingMillis": 60000
  }
}
```

And you can read it from S3 Bucket `CONFIG_BUCKET` via `./manage-apps.sh get` and upload this file into S3 Bucket via `./manage-apps.sh set`.

- Lobby server will disconnects after `maxWaitingMillis` milliseconds if there are no matchable users.
- Lobby server can make matching group less than `memberCount` if cannot find matchable users anymore after `incompletedMatchingWaitMillis` milliseconds.

## License

MIT
