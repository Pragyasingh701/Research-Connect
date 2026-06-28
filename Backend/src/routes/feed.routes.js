import express from 'express';
import * as feedController from '../controllers/feed.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to feed routes
router.use(protect);

router.get('/home', feedController.getHomeFeed);
router.get('/trending', feedController.getTrendingPublications);
router.get('/recommendations/researchers', feedController.getRecommendedResearchers);

export default router;
