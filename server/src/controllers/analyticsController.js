// src/controllers/analyticsController.js
import redisClient from '../config/redis.js';

export default {
  // GET /api/analytics/recent-searches?userId=abc
  async getRecentSearches(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const recentKey = `recent:${userId}`;
      const searches = await redisClient.lRange(recentKey, 0, 9);

      return res.json({
        searches: searches || []
      });
    } catch (error) {
      console.error('Get recent searches error:', error);
      return res.status(500).json({ error: 'Failed to get recent searches' });
    }
  },

  // GET /api/analytics/popular-categories
  async getPopularCategories(req, res) {
    try {
      const categories = await redisClient.hGetAll('popular:category');

      // Convert to array and sort by count
      const sortedCategories = Object.entries(categories)
        .map(([category, count]) => ({
          category,
          count: parseInt(count)
        }))
        .sort((a, b) => b.count - a.count);

      return res.json({
        categories: sortedCategories
      });
    } catch (error) {
      console.error('Get popular categories error:', error);
      return res.status(500).json({ error: 'Failed to get popular categories' });
    }
  }
};
