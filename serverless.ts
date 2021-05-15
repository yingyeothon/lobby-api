import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "yyt-lobby",
  plugins: [
    "serverless-webpack",
    "serverless-prune-plugin",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    stage: "${env:STAGE}",
    runtime: "nodejs12.x",
    region: "ap-northeast-2",
    lambdaHashingVersion: "20201221",
    timeout: 6,
    memorySize: 256,
    tracing: {
      apiGateway: true,
      lambda: true,
    },
    logs: {
      restApi: true,
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      REDIS_HOST: "${env:REDIS_HOST}",
      REDIS_PASSWORD: "${env:REDIS_PASSWORD}",
      WS_ENDPOINT: "${env:WS_ENDPOINT}",
      CALLBACK_URL_PREFIX: "${env:CALLBACK_URL_PREFIX}",
      JWT_SECRET_KEY: "${env:JWT_SECRET_KEY}",
      CONFIG_BUCKET: "${env:CONFIG_BUCKET}",
      APPS_OBJECT_KEY: "${env:APPS_OBJECT_KEY}",
      SLACK_WEBHOOK_URL: "${env:SLACK_WEBHOOK_URL}",
      SLACK_CHANNEL: "${env:SLACK_CHANNEL}",
      SLACK_LOG_LEVEL: '${env:SLACK_LOG_LEVEL, "warn"}',
      CONSOLE_LOG_LEVEL: '${env:CONSOLE_LOG_LEVEL, "trace"}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["lambda:InvokeFunction"],
            Resource: [
              {
                "Fn::Join": [
                  ":",
                  [
                    "arn:aws:lambda",
                    {
                      Ref: "AWS::Region",
                    },
                    {
                      Ref: "AWS::AccountId",
                    },
                    "function",
                    "*",
                  ],
                ],
              },
            ],
          },
          {
            Effect: "Allow",
            Action: ["s3:GetObject"],
            Resource: ["arn:aws:s3:::${env:CONFIG_BUCKET}/*"],
          },
        ],
      },
    },
  },
  custom: {
    prune: {
      automatic: true,
      number: 7,
    },
  },
  package: {
    individually: process.env.ANALYZE_BUNDLE !== "1",
  },
  functions: {
    connect: {
      handler: "src/connect.handle",
      events: [
        {
          websocket: {
            route: "$connect",
          },
        },
      ],
    },
    disconnect: {
      handler: "src/disconnect.handle",
      timeout: 3,
      events: [
        {
          websocket: {
            route: "$disconnect",
          },
        },
      ],
    },
    message: {
      handler: "src/message.handle",
      timeout: 12,
      events: [
        {
          websocket: {
            route: "$default",
          },
        },
      ],
    },
    invoked: {
      handler: "src/invoked.handle",
      events: [
        {
          http: "PUT /invoked/{appId}/{gameId}",
        },
      ],
    },
    tick: {
      handler: "src/tick.handle",
      timeout: 30,
      events: [
        {
          schedule: "cron(* * * * ? *)",
        },
      ],
    },
    clearAppsCache: {
      handler: "src/cache.doClearAppsCache",
      events: [
        {
          http: "DELETE /_cache/apps",
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
