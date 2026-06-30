// src/controllers/quizController.js
import redisClient from '../config/redis.js';
import cacheService from '../services/cacheService.js';
import leaderboardService from '../services/leaderboardService.js';
import Score from '../models/scoreModel.js';

export default {
  // POST /api/quiz/submit
  async submitAnswers(req, res) {
    try {
      const { userId, state, category, difficulty, answers } = req.body;

      // answers format: [{ questionId, selectedAnswer }, ...]

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'Invalid answers format' });
      }

      // Get questions from Redis cache
      const cacheKey = `question:${state}:${category}:${difficulty}`;
      const questions = await cacheService.getQuestion(cacheKey);

      if (!questions || questions.length === 0) {
        return res.status(404).json({ error: 'Questions not found in cache' });
      }

      // Create a map of questionId -> correctAnswer for quick lookup
      const questionMap = new Map();
      questions.forEach((q) => {
        questionMap.set(q.id, q.correctAnswer);
      });

      // Calculate score and results
      let correctCount = 0;
      let wrongCount = 0;
      let totalPoints = 0;
      const results = [];

      answers.forEach((answer) => {
        const { questionId, selectedAnswer } = answer;
        const correctAnswer = questionMap.get(questionId);

        if (!correctAnswer) {
          // Question not found
          results.push({
            questionId,
            selectedAnswer,
            correctAnswer: null,
            isCorrect: false,
            points: 0,
            message: 'Question not found'
          });
          wrongCount++;
          return;
        }

        const isCorrect = selectedAnswer === correctAnswer;
        const points = isCorrect ? 10 : 0; // 10 points per correct answer

        if (isCorrect) {
          correctCount++;
          totalPoints += points;
        } else {
          wrongCount++;
        }

        results.push({
          questionId,
          selectedAnswer,
          correctAnswer,
          isCorrect,
          points,
          message: isCorrect ? 'Correct!' : 'Incorrect'
        });
      });

      // Calculate percentage
      const totalQuestions = answers.length;
      const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      // Update Redis leaderboard
      await leaderboardService.addScore(userId, totalPoints);

      // Save score history to MongoDB
      try {
        await Score.create({
          userId,
          score: totalPoints,
          date: new Date()
        });
      } catch (mongoError) {
        console.error('MongoDB score save failed:', mongoError);
      }

      // Emit Socket.IO event for real-time leaderboard update
      if (global.io) {
        const top = await leaderboardService.getTopN(10);
        global.io.emit('scoreUpdated', top);
      }

      // Return detailed results
      return res.json({
        summary: {
          totalQuestions,
          correctCount,
          wrongCount,
          totalPoints,
          percentage: percentage.toFixed(2)
        },
        results,
        leaderboard: await leaderboardService.getTopN(10)
      });
    } catch (error) {
      console.error('Submit answers error:', error);
      return res.status(500).json({ error: 'Failed to submit answers' });
    }
  },

  // GET /api/quiz/questions
  async getQuestions(req, res) {
    try {
      const { state, category, difficulty } = req.query;

      if (!state || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const cacheKey = `question:${state}:${category}:${difficulty}`;
      const questions = await cacheService.getQuestion(cacheKey);

      if (!questions) {
        return res.status(404).json({ error: 'Questions not found' });
      }

      // Return questions without correctAnswer (for quiz display)
      const quizQuestions = questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        category: q.category,
        state: q.state,
        points: q.points
      }));

      return res.json({ questions: quizQuestions });
    } catch (error) {
      console.error('Get questions error:', error);
      return res.status(500).json({ error: 'Failed to get questions' });
    }
  },

  // GET /api/quiz/result/:questionId
  async getQuestionResult(req, res) {
    try {
      const { questionId } = req.params;
      const { state, category, difficulty } = req.query;

      const cacheKey = `question:${state}:${category}:${difficulty}`;
      const questions = await cacheService.getQuestion(cacheKey);

      if (!questions) {
        return res.status(404).json({ error: 'Questions not found' });
      }

      const question = questions.find((q) => q.id === questionId);

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Return question with correct answer and explanation
      return res.json({
        question: {
          id: question.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          category: question.category,
          state: question.state,
          points: question.points
        }
      });
    } catch (error) {
      console.error('Get question result error:', error);
      return res.status(500).json({ error: 'Failed to get question result' });
    }
  }
};
