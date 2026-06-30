// src/workers/questionWorker.js
import redisClient from '../config/redis.js';
import cacheService from '../services/cacheService.js';
import llmService from '../services/llmService.js';
import Question from '../models/questionModel.js';
import pubsub from '../services/pubsubService.js';

(async () => {
  console.log('Question worker started, waiting for jobs...');
  while (true) {
    try {
      // BLPOP blocks until an element is available in 'questionQueue'
      const res = await redisClient.blPop('questionQueue', 0);
      const job = JSON.parse(res.element);
      const { state, category, difficulty, userId, requestId } = job;
      console.log('Processing job:', job);

      // Generate via LLM (Groq first, fallback to Gemini)
      const result = await llmService.generateQuestion(
        state,
        category,
        difficulty
      );
      const questions = result.questions;

      // Store in Redis cache (6h)
      const cacheKey = `question:${state}:${category}:${difficulty}`;
      await cacheService.setQuestion(cacheKey, questions);

      // Save to MongoDB for audit/analytics
      try {
        await Question.create({
          userId,
          state,
          category,
          difficulty,
          questions,
          generatedAt: new Date()
        });
      } catch (mongoError) {
        console.error('MongoDB save failed in worker:', mongoError);
      }

      // Notify client via Socket.IO (if io is available globally)
      if (global.io) {
        global.io.emit(`questionReady:${requestId}`, {
          questions,
          source: 'worker',
          cacheKey
        });
      }

      // Also notify via Redis Pub/Sub for distributed systems
      await pubsub.publish('question:generated', {
        requestId,
        userId,
        state,
        category,
        difficulty,
        questions,
        cacheKey
      });

      console.log('Job done:', cacheKey);
    } catch (err) {
      console.error('Worker error:', err);
    }
  }
})();
