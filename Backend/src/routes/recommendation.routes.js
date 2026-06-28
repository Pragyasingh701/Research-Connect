import express from 'express';
import * as feedController from '../controllers/feed.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Map recommendation API endpoints to corresponding feed controller handlers
router.get('/', feedController.getHomeFeed); // Returns personalized publication recommendations by default
router.get('/publications', feedController.getHomeFeed);
router.get('/researchers', feedController.getRecommendedResearchers);

export default router;
