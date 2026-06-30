// src/routes/analyticsRoutes.js
import express from 'express';
import analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// Get recent searches
router.get('/recent-searches', analyticsController.getRecentSearches);

// Get popular categories
router.get('/popular-categories', analyticsController.getPopularCategories);

export default router;
