import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getFollowSuggestions,
  getMutualFollowers,
  getFollowAnalytics,
  getFollowerDashboard,
} from '../controllers/follow.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/follow/:userId', followUser);
router.post('/unfollow/:userId', unfollowUser); // POST as requested in spec
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.get('/follow/status/:userId', getFollowStatus);
router.get('/follow/suggestions', getFollowSuggestions);
router.get('/follow/mutual/:userId', getMutualFollowers);
router.get('/follow/analytics', getFollowAnalytics);
router.get('/follows/dashboard', getFollowerDashboard);

export default router;
