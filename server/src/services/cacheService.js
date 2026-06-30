// src/services/cacheService.js
import redisClient from '../config/redis.js';

export default {
  // Redis me question cache check karo
  async getQuestion(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Redis me question cache set karo (value array of questions)
  async setQuestion(key, questions, ttlSeconds = 6 * 3600) {
    await redisClient.set(key, JSON.stringify(questions), {
      EX: ttlSeconds
    });
  },

  // Rate limit counter operations
  async incrementRateLimit(key, windowSeconds) {
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    return count;
  }
};
