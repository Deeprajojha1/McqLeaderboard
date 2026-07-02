// src/controllers/quizController.js
import redisClient from '../config/redis.js';
import cacheService from '../services/cacheService.js';
import leaderboardService from '../services/leaderboardService.js';
import Score from '../models/scoreModel.js';
import Question from '../models/questionModel.js';
import UserAnswer from '../models/userAnswerModel.js';

export default {
  // POST /api/quiz/submit
  async submitAnswers(req, res) {
    try {
      const { userId, state, category, difficulty, answers } = req.body;

      console.log('Submit answers request:', { userId, state, category, difficulty, answers });

      // answers format: [{ questionId, selectedAnswer }, ...]

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'Invalid answers format' });
      }

      // Store user answers in Redis for later retrieval
      const userAnswersKey = `user_answers:${userId}:${state}:${category}:${difficulty}`;
      await redisClient.setEx(userAnswersKey, 24 * 60 * 60, JSON.stringify(answers)); // Store for 24 hours
      console.log('User answers stored in Redis:', userAnswersKey);

      // Also store in MongoDB as backup
      try {
        await UserAnswer.create({
          userId,
          state,
          category,
          difficulty,
          answers,
          submittedAt: new Date()
        });
        console.log('User answers stored in MongoDB');
      } catch (mongoError) {
        console.error('Failed to store user answers in MongoDB:', mongoError);
      }

      // Get questions from Redis cache
      const cacheKey = `question:${state}:${category}:${difficulty}`;
      console.log('Cache key:', cacheKey);
      let questions = await cacheService.getQuestion(cacheKey);
      console.log('Questions from Redis:', questions ? questions.length : 0);

      // Redis miss - fallback to MongoDB
      if (!questions || questions.length === 0) {
        try {
          console.log('Redis miss, trying MongoDB...');
          const mongoQuestions = await Question.findOne({
            state,
            category,
            difficulty
          }).sort({ generatedAt: -1 });

          console.log('MongoDB result:', mongoQuestions);

          if (mongoQuestions && mongoQuestions.questions) {
            questions = mongoQuestions.questions;

            // Cache MongoDB result in Redis
            await cacheService.setQuestion(cacheKey, questions);
            console.log('Questions fetched from MongoDB and cached in Redis');
          }
        } catch (mongoError) {
          console.error('MongoDB question fetch failed:', mongoError);
        }
      }

      if (!questions || questions.length === 0) {
        return res.status(404).json({ error: 'Questions not found. Please generate questions first using /api/question/generate' });
      }

      console.log('Found questions:', questions.length);
      console.log('Question IDs from database:', questions.map(q => ({ id: q.id, question: q.question.substring(0, 50) })));
      console.log('Question IDs from request:', answers.map(a => a.questionId));

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

        console.log('Processing answer:', { questionId, selectedAnswer, correctAnswer });

        if (!correctAnswer) {
          // Question not found
          console.log('Question not found in map:', questionId);
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

        console.log('Answer check:', { questionId, isCorrect, points });

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

      console.log('Score calculated:', { correctCount, wrongCount, totalPoints, percentage });

      // Update Redis leaderboard
      // Ensure userId is string and totalPoints is number
      const userIdStr = String(userId);
      const scoreNum = Number(totalPoints);
      console.log('Calling leaderboardService with:', { userId: userIdStr, score: scoreNum, types: { userId: typeof userIdStr, score: typeof scoreNum } });

      await leaderboardService.addScore(userIdStr, scoreNum);
      console.log('Leaderboard updated');

      // Save score history to MongoDB
      try {
        await Score.create({
          userId,
          score: totalPoints,
          date: new Date()
        });
        console.log('Score saved to MongoDB');
      } catch (mongoError) {
        console.error('MongoDB score save failed:', mongoError);
      }

      // Emit Socket.IO event for real-time leaderboard update
      if (global.io) {
        const top = await leaderboardService.getTopN(10);
        global.io.emit('scoreUpdated', top);
        console.log('Socket.IO event emitted');
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
      console.error('Error stack:', error.stack);
      return res.status(500).json({ error: 'Failed to submit answers', details: error.message });
    }
  },

  // GET /api/quiz/questions
  async getQuestions(req, res) {
    try {
      const { state, category, difficulty } = req.query;

      console.log('Received params:', { state, category, difficulty });

      if (!state || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const cacheKey = `question:${state}:${category}:${difficulty}`;
      console.log('Cache key:', cacheKey);
      let questions = await cacheService.getQuestion(cacheKey);

      // Redis miss - fallback to MongoDB
      if (!questions || questions.length === 0) {
        try {
          const mongoQuestions = await Question.findOne({
            state,
            category,
            difficulty
          }).sort({ generatedAt: -1 });

          if (mongoQuestions && mongoQuestions.questions) {
            questions = mongoQuestions.questions;

            // Cache MongoDB result in Redis
            await cacheService.setQuestion(cacheKey, questions);
            console.log('Questions fetched from MongoDB and cached in Redis');
          }
        } catch (mongoError) {
          console.error('MongoDB question fetch failed:', mongoError);
        }
      }

      if (!questions || questions.length === 0) {
        return res.status(404).json({ error: 'Questions not found. Please generate questions first using /api/question/generate' });
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
      const { state, category, difficulty, selectedAnswer } = req.query;

      console.log('Get question result request:', { questionId, state, category, difficulty, selectedAnswer });

      if (!state || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required query parameters: state, category, difficulty' });
      }

      const cacheKey = `question:${state}:${category}:${difficulty}`;
      let questions = await cacheService.getQuestion(cacheKey);

      // Redis miss - fallback to MongoDB
      if (!questions || questions.length === 0) {
        try {
          console.log('Redis miss, trying MongoDB...');
          const mongoQuestions = await Question.findOne({
            state,
            category,
            difficulty
          }).sort({ generatedAt: -1 });

          console.log('MongoDB result:', mongoQuestions);

          if (mongoQuestions && mongoQuestions.questions) {
            questions = mongoQuestions.questions;

            // Cache MongoDB result in Redis
            await cacheService.setQuestion(cacheKey, questions);
            console.log('Questions fetched from MongoDB and cached in Redis');
          }
        } catch (mongoError) {
          console.error('MongoDB question fetch failed:', mongoError);
        }
      }

      if (!questions || questions.length === 0) {
        return res.status(404).json({ error: 'Questions not found. Please generate questions first using /api/question/generate' });
      }

      console.log('Available question IDs:', questions.map(q => q.id));
      console.log('Looking for questionId:', questionId);

      const question = questions.find((q) => q.id === questionId);

      if (!question) {
        return res.status(404).json({
          error: 'Question not found',
          requestedId: questionId,
          availableIds: questions.map(q => q.id)
        });
      }

      // Check if user's answer is correct
      const isCorrect = selectedAnswer === question.correctAnswer;

      // Return question with user's selected answer, correct answer, and explanation
      return res.json({
        question: {
          id: question.id,
          question: question.question,
          options: question.options,
          userAnswer: selectedAnswer || null,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation,
          difficulty: question.difficulty,
          category: question.category,
          state: question.state,
          points: question.points
        }
      });
    } catch (error) {
      console.error('Get question result error:', error);
      return res.status(500).json({ error: 'Failed to get question result', details: error.message });
    }
  },

  // GET /api/quiz/results/all - Get all question results with user answers
  async getAllResults(req, res) {
    try {
      const { state, category, difficulty, userId } = req.query;

      console.log('Get all results request:', { state, category, difficulty, userId });

      if (!state || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required parameters: state, category, difficulty' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameter: userId' });
      }

      // Fetch user answers from Redis
      const userAnswersKey = `user_answers:${userId}:${state}:${category}:${difficulty}`;
      let userAnswersStr = await redisClient.get(userAnswersKey);

      let parsedAnswers;

      // Redis miss - fallback to MongoDB
      if (!userAnswersStr) {
        console.log('User answers not found in Redis, trying MongoDB...');
        try {
          const userAnswerDoc = await UserAnswer.findOne({
            userId,
            state,
            category,
            difficulty
          }).sort({ submittedAt: -1 });

          if (userAnswerDoc && userAnswerDoc.answers) {
            parsedAnswers = userAnswerDoc.answers;

            // Cache MongoDB result in Redis
            await redisClient.setEx(userAnswersKey, 24 * 60 * 60, JSON.stringify(parsedAnswers));
            console.log('User answers fetched from MongoDB and cached in Redis');
          } else {
            return res.status(404).json({ error: 'No submitted answers found for this user. Please submit answers first using /api/quiz/submit' });
          }
        } catch (mongoError) {
          console.error('MongoDB user answers fetch failed:', mongoError);
          return res.status(500).json({ error: 'Failed to retrieve user answers' });
        }
      } else {
        // Parse from Redis
        try {
          parsedAnswers = JSON.parse(userAnswersStr);
        } catch (parseError) {
          return res.status(500).json({ error: 'Failed to parse stored answers' });
        }
        console.log('Retrieved user answers from Redis:', parsedAnswers);
      }

      const cacheKey = `question:${state}:${category}:${difficulty}`;
      let questions = await cacheService.getQuestion(cacheKey);

      // Redis miss - fallback to MongoDB
      if (!questions || questions.length === 0) {
        try {
          console.log('Redis miss, trying MongoDB...');
          const mongoQuestions = await Question.findOne({
            state,
            category,
            difficulty
          }).sort({ generatedAt: -1 });

          if (mongoQuestions && mongoQuestions.questions) {
            questions = mongoQuestions.questions;
            await cacheService.setQuestion(cacheKey, questions);
          }
        } catch (mongoError) {
          console.error('MongoDB question fetch failed:', mongoError);
        }
      }

      if (!questions || questions.length === 0) {
        return res.status(404).json({ error: 'Questions not found' });
      }

      // Create a map of questionId -> correctAnswer
      const questionMap = new Map();
      questions.forEach((q) => {
        questionMap.set(q.id, q);
      });

      // Calculate results for all answers
      const results = parsedAnswers.map((answer) => {
        const { questionId, selectedAnswer } = answer;
        const question = questionMap.get(questionId);

        if (!question) {
          return {
            questionId,
            userAnswer: selectedAnswer,
            correctAnswer: null,
            isCorrect: false,
            explanation: 'Question not found',
            points: 0
          };
        }

        const isCorrect = selectedAnswer === question.correctAnswer;
        const points = isCorrect ? question.points || 10 : 0;

        return {
          questionId,
          question: question.question,
          options: question.options,
          userAnswer: selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation,
          points: points,
          difficulty: question.difficulty,
          category: question.category,
          state: question.state
        };
      });

      // Calculate summary
      const correctCount = results.filter(r => r.isCorrect).length;
      const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
      const percentage = (correctCount / results.length) * 100;

      return res.json({
        summary: {
          totalQuestions: results.length,
          correctCount,
          wrongCount: results.length - correctCount,
          totalPoints,
          percentage: percentage.toFixed(2)
        },
        results
      });
    } catch (error) {
      console.error('Get all results error:', error);
      return res.status(500).json({ error: 'Failed to get all results', details: error.message });
    }
  }
};
