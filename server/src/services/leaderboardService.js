// src/services/leaderboardService.js
import redisClient from '../config/redis.js';

export default {
  // User ka score add/increment karo
  async addScore(userId, points) {
    console.log('addScore called with:', { userId, points, types: { userId: typeof userId, points: typeof points } });

    // zIncrBy increments the score by 'points' for the member 'userId'
    // If userId doesn't exist, it adds it with score = points
    // If userId exists, it increments by points
    const result = await redisClient.zIncrBy('leaderboard', points, userId);
    console.log('zIncrBy result (new score):', result);

    return result;
  },

  // Top N users laane ke liye reverse range query
  async getTopN(n = 10) {
    // First, check if leaderboard exists and has data
    const exists = await redisClient.exists('leaderboard');
    console.log('Leaderboard exists:', exists);

    if (!exists) {
      console.log('Leaderboard is empty');
      return [];
    }

    // Use zRange with REV option (newer Redis v4+ API)
    const entries = await redisClient.zRange('leaderboard', 0, n - 1, {
      REV: true,
      WITHSCORES: true
    });
    console.log('Redis zRange entries:', entries);
    console.log('Entries type:', typeof entries);
    console.log('Entries length:', entries.length);
    console.log('First entry:', entries[0]);

    const result = [];

    if (entries.length === 0) {
      console.log('No entries in leaderboard');
      return [];
    }

    // Check if entries is array of objects (newer Redis version)
    if (typeof entries[0] === 'object' && entries[0].value !== undefined) {
      console.log('Using object format parsing');
      for (const entry of entries) {
        result.push({
          userId: entry.value,
          score: Number(entry.score)
        });
      }
    } else {
      // Array format: [userId1, score1, userId2, score2, ...]
      console.log('Using array format parsing');

      // Workaround: If data is corrupted (all strings), try to fix it
      // Check if all entries are strings (corrupted data)
      const allStrings = entries.every(e => typeof e === 'string');
      if (allStrings && entries.length % 2 !== 0) {
        console.log('WARNING: Corrupted data detected - all entries are strings and odd length');
        console.log('Attempting to recover by using individual scores...');

        // Try to get scores individually using zScore
        for (let i = 0; i < Math.min(entries.length, n); i++) {
          const userId = entries[i];
          try {
            const score = await redisClient.zScore('leaderboard', userId);
            if (score !== null) {
              result.push({
                userId,
                score: Number(score)
              });
            }
          } catch (err) {
            console.error('Error getting score for userId:', userId, err);
          }
        }
      } else {
        // Normal array parsing
        for (let i = 0; i < entries.length; i += 2) {
          const userId = entries[i];
          const scoreStr = entries[i + 1];
          const score = scoreStr ? Number(scoreStr) : 0;

          console.log('Processing entry:', { userId, scoreStr, score });

          result.push({
            userId,
            score
          });
        }
      }
    }

    console.log('Final leaderboard result:', result);
    return result;
  },

  // Get rank (optional)
  async getRank(userId) {
    // ZREVRANK (0-based rank)
    return await redisClient.zRevRank('leaderboard', userId);
  },

  // Clear leaderboard (for testing/reset)
  async clearLeaderboard() {
    await redisClient.del('leaderboard');
    console.log('Leaderboard cleared');
  }
};
