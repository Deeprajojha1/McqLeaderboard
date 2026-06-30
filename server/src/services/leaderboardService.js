// src/services/leaderboardService.js
import redisClient from '../config/redis.js';

export default {
  // User ka score add/increment karo
  async addScore(userId, points) {
    await redisClient.zIncrBy('leaderboard', [
      { score: points, value: userId }
    ]);
    // Alternatively: await redisClient.zIncrBy('leaderboard', points, userId);
  },

  // Top N users laane ke liye reverse range query
  async getTopN(n = 10) {
    const entries = await redisClient.zRange('leaderboard', 0, n - 1, {
      REV: true,
      WITHSCORES: true
    });
    // zRange with REV returns [user1, score1, user2, score2, ...]
    const result = [];
    for (let i = 0; i < entries.length; i += 2) {
      result.push({
        userId: entries[i],
        score: Number(entries[i + 1])
      });
    }
    return result;
  },

  // Get rank (optional)
  async getRank(userId) {
    // ZREVRANK (0-based rank)
    return await redisClient.zRevRank('leaderboard', userId);
  }
};
