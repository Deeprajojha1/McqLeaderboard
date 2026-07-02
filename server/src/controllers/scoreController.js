// src/controllers/scoreController.js
import leaderboardService from '../services/leaderboardService.js';
import Score from '../models/scoreModel.js';
import User from '../models/userModel.js';

// Helper function to attach usernames to leaderboard entries
async function populateUsernames(topEntries) {
  if (!topEntries || topEntries.length === 0) return [];
  try {
    const userIds = topEntries.map(item => item.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'username');
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.username;
    });
    return topEntries.map(item => ({
      userId: item.userId,
      username: userMap[item.userId] || 'Anonymous',
      score: item.score
    }));
  } catch (err) {
    console.error('Error populating usernames on leaderboard:', err);
    return topEntries.map(item => ({ ...item, username: 'Anonymous' }));
  }
}

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

    // Populate usernames before emitting socket and returning response
    const populatedTop = await populateUsernames(top);

    // 5. Emit Socket event (handled in server.js via io)
    if (global.io) {
      global.io.emit('scoreUpdated', populatedTop);
    }

    // 6. Return new score or leaderboard
    return res.json({ leaderboard: populatedTop });
  },

  // GET /api/leaderboard
  async getLeaderboard(req, res) {
    const { state, category, difficulty } = req.query;

    const hasFilters = (state && state !== 'All States') || 
                       (category && category !== 'All Categories') || 
                       (difficulty && difficulty !== 'All Difficulties');

    // 1. If no filters, try to fetch from Redis first (global leaderboard)
    if (!hasFilters) {
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
            userId: item._id.toString(),
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

      // Populate usernames
      const populatedTop = await populateUsernames(top);
      return res.json({ leaderboard: populatedTop });
    }

    // 3. If filters are active, query MongoDB directly with aggregation
    try {
      const match = {};
      if (state && state !== 'All States') match.state = state;
      if (category && category !== 'All Categories') match.category = category;
      if (difficulty && difficulty !== 'All Difficulties') match.difficulty = difficulty;

      const mongoScores = await Score.aggregate([
        { $match: match },
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

      const top = mongoScores.map((item) => ({
        userId: item._id.toString(),
        score: item.totalScore
      }));

      const populatedTop = await populateUsernames(top);
      return res.json({ leaderboard: populatedTop });
    } catch (mongoError) {
      console.error('MongoDB filtered leaderboard fetch failed:', mongoError);
      return res.status(500).json({ error: 'Failed to fetch filtered leaderboard' });
    }
  }
};

