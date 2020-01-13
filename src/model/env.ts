export default {
  redisHost: process.env.REDIS_HOST!,
  redisPassword: process.env.REDIS_PASSWORD,
  webSocketEndpoint: process.env.WS_ENDPOINT!,
  jwtSecretKey: process.env.JWT_SECRET_KEY!,
  isOffline: process.env.IS_OFFLINE !== undefined
};
