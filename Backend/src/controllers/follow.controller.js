import * as followService from '../services/follow.service.js';
import { broadcastFollowUpdate, sendRealTimeNotification } from '../services/socket.service.js';
import { sendNewFollowerEmail } from '../services/email.service.js';
import User from '../models/User.js';

/**
 * Follow a researcher
 * POST /api/follow/:userId
 */
export const followUser = async (req, res, next) => {
  try {
    const followerId = req.user.id || req.user._id;
    const { userId: followingId } = req.params;

    const { follow, followerUser, followedUser, notification } = await followService.followUser(
      followerId,
      followingId
    );

    // Broadcast count updates to all clients in the profile rooms
    broadcastFollowUpdate(
      followerId,
      followingId,
      followedUser.followersCount,
      followerUser.followingCount
    );

    // Send real-time events directly to the target user
    sendRealTimeNotification(followingId, 'researcher-followed', {
      followerId,
      followerName: followerUser.fullName,
    });
    sendRealTimeNotification(followingId, 'notification-created', notification);

    // Send email notification in background
    if (followedUser.email) {
      sendNewFollowerEmail(followedUser.email, followerUser.fullName).catch((err) =>
        console.error('Failed to send follower email:', err.message)
      );
    }

    res.status(201).json({
      status: 'success',
      data: follow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfollow a researcher
 * POST /api/unfollow/:userId
 */
export const unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user.id || req.user._id;
    const { userId: followingId } = req.params;

    const { follow, followerUser, followedUser } = await followService.unfollowUser(
      followerId,
      followingId
    );

    // Broadcast count updates to all clients in the profile rooms
    broadcastFollowUpdate(
      followerId,
      followingId,
      followedUser.followersCount,
      followerUser.followingCount
    );

    // Send real-time events directly to the target user
    sendRealTimeNotification(followingId, 'researcher-unfollowed', {
      followerId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Unfollowed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get followers list for a user
 * GET /api/followers/:userId
 */
export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;

    const { followers, total, hasMore } = await followService.getFollowers(userId, {
      ...req.query,
      currentUserId,
    });

    res.status(200).json({
      status: 'success',
      results: followers.length,
      total,
      hasMore,
      data: followers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get following list for a user
 * GET /api/following/:userId
 */
export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { following, total, hasMore } = await followService.getFollowing(userId, req.query);

    res.status(200).json({
      status: 'success',
      results: following.length,
      total,
      hasMore,
      data: following,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get follow status between current user and target user
 * GET /api/follow/status/:userId
 */
export const getFollowStatus = async (req, res, next) => {
  try {
    const followerId = req.user.id || req.user._id;
    const { userId: followingId } = req.params;

    const status = await followService.getFollowStatus(followerId, followingId);

    res.status(200).json({
      status: 'success',
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mutual followers
 * GET /api/follow/mutual/:userId
 */
export const getMutualFollowers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { userId: targetUserId } = req.params;

    const mutual = await followService.getMutualFollowers(currentUserId, targetUserId);

    res.status(200).json({
      status: 'success',
      results: mutual.length,
      data: mutual,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get follow suggestions
 * GET /api/follow/suggestions
 */
export const getFollowSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit, 10) || 5;

    const suggestions = await followService.getFollowSuggestions(userId, limit);

    res.status(200).json({
      status: 'success',
      results: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get follow analytics
 * GET /api/follow/analytics
 */
export const getFollowAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const analytics = await followService.getFollowAnalytics(userId);

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get follower dashboard summary
 * GET /api/follows/dashboard
 */
export const getFollowerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    // 1. Followers
    const { followers } = await followService.getFollowers(userId, { limit: 5 });

    // 2. Following
    const { following } = await followService.getFollowing(userId, { limit: 5 });

    // 3. Suggested
    const suggested = await followService.getFollowSuggestions(userId, 5);

    // 4. Popular researchers
    const Follow = (await import('../models/Follow.js')).default;
    const Profile = (await import('../models/Profile.js')).default;
    const User = (await import('../models/User.js')).default;

    const popularAgg = await Follow.aggregate([
      { $group: { _id: '$followingId', followerCount: { $sum: 1 } } },
      { $sort: { followerCount: -1 } },
      { $limit: 6 },
    ]);
    const popularList = [];
    for (const item of popularAgg) {
      if (item._id.toString() === userId.toString()) continue;
      const user = await User.findById(item._id).select('fullName email');
      const profile = await Profile.findOne({ user: item._id })
        .select('profilePhoto designation institution country');
      if (user && profile) {
        popularList.push({ user, profile, followerCount: item.followerCount });
      }
    }

    // 5. Trending researchers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendingAgg = await Follow.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$followingId', followerCount: { $sum: 1 } } },
      { $sort: { followerCount: -1 } },
      { $limit: 6 },
    ]);
    const trendingList = [];
    for (const item of trendingAgg) {
      if (item._id.toString() === userId.toString()) continue;
      const user = await User.findById(item._id).select('fullName email');
      const profile = await Profile.findOne({ user: item._id })
        .select('profilePhoto designation institution country');
      if (user && profile) {
        trendingList.push({ user, profile, followerCount: item.followerCount });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        followers,
        following,
        suggested,
        popular: popularList.slice(0, 5),
        trending: trendingList.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};
