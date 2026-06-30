// src/controllers/questionController.js
import cacheService from '../services/cacheService.js';
import redisClient from '../config/redis.js';
import llmService from '../services/llmService.js';
import Question from '../models/questionModel.js';
import queueService from '../services/queueService.js';
import { randomUUID } from 'crypto';

export default {
  // POST /api/question/generate
  // async: true (default) - Queue-based, returns requestId, client waits for Socket.IO event
  // async: false - Synchronous, returns questions immediately
  async generate(req, res) {
    const { state, category, difficulty, async: useAsync = true } = req.body;
    const userId = req.userId; // Get from auth middleware
    const cacheKey = `question:${state}:${category}:${difficulty}`;

    // 1. Cache check
    const cached = await cacheService.getQuestion(cacheKey);
    if (cached) {
      return res.json({ questions: cached, source: 'cache' });
    }

    // 2. Redis miss - try MongoDB fallback
    let questions;
    try {
      const mongoQuestion = await Question.findOne({
        state,
        category,
        difficulty
      }).sort({ generatedAt: -1 });

      if (mongoQuestion && mongoQuestion.questions) {
        questions = mongoQuestion.questions;
        // Cache MongoDB result in Redis
        await cacheService.setQuestion(cacheKey, questions);
        return res.json({ questions, source: 'mongodb' });
      }
    } catch (mongoError) {
      console.error('MongoDB question fetch failed:', mongoError);
    }

    // 3. Choose approach based on 'async' parameter
    if (useAsync) {
      // ASYNC APPROACH: Queue-based with Socket.IO notification
      const requestId = randomUUID();

      // Enqueue job for worker
      await queueService.enqueueQuestion({
        requestId,
        state,
        category,
        difficulty,
        userId
      });

      // Update recent searches and popular categories
      const recentKey = `recent:${userId}`;
      await redisClient.lPush(recentKey, `${state}:${category}`);
      await redisClient.lTrim(recentKey, 0, 9);
      await redisClient.hIncrBy('popular:category', category, 1);

      // Return requestId - client should listen for Socket.IO event
      return res.json({
        message: 'Question generation queued',
        requestId,
        source: 'queue',
        // Client should listen for: socket.on(`questionReady:${requestId}`, callback)
      });
    } else {
      // SYNC APPROACH: Direct LLM call (immediate response)
      try {
        const result = await llmService.generateQuestion(
          state,
          category,
          difficulty
        );
        questions = result.questions;
      } catch (err) {
        return res.status(500).json({ error: 'LLM generation failed' });
      }

      // Cache the result in Redis
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
        console.error('MongoDB question save failed:', mongoError);
      }

      // Update recent searches and popular categories
      const recentKey = `recent:${userId}`;
      await redisClient.lPush(recentKey, `${state}:${category}`);
      await redisClient.lTrim(recentKey, 0, 9);
      await redisClient.hIncrBy('popular:category', category, 1);

      // Return questions immediately
      return res.json({ questions, source: 'llm' });
    }
  }
};
