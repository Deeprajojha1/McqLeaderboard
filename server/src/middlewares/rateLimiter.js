// src/middlewares/rateLimiter.js
import cacheService from '../services/cacheService.js';

export default (limit, windowSeconds) => {
  return async (req, res, next) => {
    // Use userId from auth middleware if available, otherwise use IP
    const userId = req.userId || req.ip;
    const key = `rate:${userId}`;
    const count = await cacheService.incrementRateLimit(key, windowSeconds);

    if (count > limit) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }

    next();
  };
};
