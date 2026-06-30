// src/services/queueService.js
import redisClient from '../config/redis.js';

export default {
  // Nayi job add karo question generation queue me
  async enqueueQuestion(jobData) {
    await redisClient.lPush('questionQueue', JSON.stringify(jobData));
  },

  // BLPOP se job pop karne ke liye worker use karega (in worker script)
};
