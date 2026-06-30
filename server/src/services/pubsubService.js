// src/services/pubsubService.js
import redisClient from '../config/redis.js';

let pubClient, subClient;

// Initialize duplicate clients for pub/sub
(async () => {
  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
})();

export default {
  // Publish message on a channel
  async publish(channel, payload) {
    await pubClient.publish(channel, JSON.stringify(payload));
  },

  // Subscribe with a handler callback
  async subscribe(channel, handler) {
    await subClient.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
  }
};
