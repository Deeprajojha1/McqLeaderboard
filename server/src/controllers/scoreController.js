// src/controllers/scoreController.js
import leaderboardService from '../services/leaderboardService.js';
import Score from '../models/scoreModel.js';

export default {
  // POST /api/score/update
  async updateScore(req, res) {
    const { delta } = req.body;
    const userId = req.userId; // Get from auth middleware

    // 1. Update Redis sorted set
    await leaderboardService.addScore(userId, delta);

    // 2. Update MongoDB score history
    try {
      await Score.create({
        userId,
        score: delta,
        date: new Date()
      });
    } catch (mongoError) {
      console.error('MongoDB score update failed:', mongoError);
      // Continue even if MongoDB fails (Redis is primary)
    }

    // 3. Fetch updated leaderboard (top 10) from Redis
    let top = await leaderboardService.getTopN(10);

    // 4. Redis miss - fallback to MongoDB
    if (!top || top.length === 0) {
      try {
        const mongoScores = await Score.aggregate([
          {
            $group: {
              _id: '$userId',
              totalScore: { $sum: '$score' },
              lastUpdate: { $max: '$date' }
            }
          },
          { $sort: { totalScore: -1 } },
          { $limit: 10 }
        ]);

        top = mongoScores.map((item) => ({
          userId: item._id,
          score: item.totalScore
        }));

        // Cache MongoDB result in Redis
        for (const item of top) {
          await leaderboardService.addScore(item.userId, item.score);
        }
      } catch (mongoError) {
        console.error('MongoDB leaderboard fetch failed:', mongoError);
      }
    }

    // 5. Emit Socket event (handled in server.js via io)
    if (global.io) {
      global.io.emit('scoreUpdated', top);
    }

    // 6. Return new score or leaderboard
    return res.json({ leaderboard: top });
  },

  // GET /api/leaderboard
  async getLeaderboard(req, res) {
    // 1. Try to fetch from Redis first
    let top = await leaderboardService.getTopN(10);

    // 2. Redis miss - fallback to MongoDB
    if (!top || top.length === 0) {
      try {
        const mongoScores = await Score.aggregate([
          {
            $group: {
              _id: '$userId',
              totalScore: { $sum: '$score' },
              lastUpdate: { $max: '$date' }
            }
          },
          { $sort: { totalScore: -1 } },
          { $limit: 10 }
        ]);

        top = mongoScores.map((item) => ({
          userId: item._id,
          score: item.totalScore
        }));

        // Cache MongoDB result in Redis
        for (const item of top) {
          await leaderboardService.addScore(item.userId, item.score);
        }
      } catch (mongoError) {
        console.error('MongoDB leaderboard fetch failed:', mongoError);
      }
    }

    return res.json({ leaderboard: top });
  }
};
