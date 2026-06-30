// src/routes/questionRoutes.js
import express from 'express';
import questionController from '../controllers/questionController.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rate limit example: 10 requests per hour per user
router.post(
  '/generate',
  authMiddleware,
  rateLimiter(10, 3600),
  questionController.generate
);

export default router;
