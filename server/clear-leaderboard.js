// Temporary script to debug and clear corrupted leaderboard
import redisClient from './src/config/redis.js';

(async () => {
  try {
    console.log('Checking leaderboard data...');

    // Check what type of data is stored
    const type = await redisClient.type('leaderboard');
    console.log('Leaderboard type:', type);

    // Get all data
    const allData = await redisClient.zRange('leaderboard', 0, -1, { WITHSCORES: true });
    console.log('All leaderboard data:', allData);

    // Delete the key
    console.log('Deleting leaderboard...');
    await redisClient.del('leaderboard');
    console.log('Leaderboard deleted successfully');

    // Verify it's gone
    const exists = await redisClient.exists('leaderboard');
    console.log('Leaderboard exists after delete:', exists);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
