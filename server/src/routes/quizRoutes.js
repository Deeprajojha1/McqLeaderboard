// src/routes/quizRoutes.js
import express from 'express';
import quizController from '../controllers/quizController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get quiz questions (without correct answers)
router.get('/questions', quizController.getQuestions);

// Submit quiz answers
router.post('/submit', authMiddleware, quizController.submitAnswers);

// Get specific question result (with correct answer and explanation)
router.get('/result/:questionId', authMiddleware, quizController.getQuestionResult);

// Get all question results with user answers
router.get('/results/all', authMiddleware, quizController.getAllResults);

// Get user quiz attempt history
router.get('/history', authMiddleware, quizController.getHistory);

export default router;
