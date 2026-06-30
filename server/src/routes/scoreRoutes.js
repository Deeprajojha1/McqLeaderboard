// src/routes/scoreRoutes.js
import express from 'express';
import scoreController from '../controllers/scoreController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/update', authMiddleware, scoreController.updateScore);
router.get('/', scoreController.getLeaderboard); // Public - anyone can view leaderboard

export default router;
