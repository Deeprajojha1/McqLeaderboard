// src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import questionRoutes from './routes/questionRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import redisClient from './config/redis.js';
import pubsub from './services/pubsubService.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// --- MongoDB connection (fallback storage) ---
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quiz', quizRoutes);

// --- Admin Pub/Sub Example ---
app.post('/api/admin/quiz/publish', async (req, res) => {
  const { quizId, title } = req.body;
  await pubsub.publish('quiz:new', { quizId, title });
  res.json({ status: 'Quiz published' });
});

export default app;
