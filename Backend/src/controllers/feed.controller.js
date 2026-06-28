import Publication from '../models/Publication.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import ResearchFeed from '../models/ResearchFeed.js';
import * as feedService from '../services/feed.service.js';
import AppError from '../utils/AppError.js';

/**
 * Get Personalized Feed for Home Dashboard
 * GET /api/v1/feed/home OR GET /api/v1/dashboard/feed
 */
export const getHomeFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const userId = req.user._id;

    // Load from cache or rebuild
    const { publications, hasMore } = await feedService.getPersonalizedFeed(userId, page, limit);

    // Map publications to type: 'publication' feed items
    const feed = publications.map((pub) => ({
      type: 'publication',
      data: pub,
      score: pub.score,
    }));

    res.status(200).json({
      status: 'success',
      results: feed.length,
      page,
      hasMore,
      feed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recommended Researchers List
 * GET /api/v1/feed/recommendations/researchers OR GET /api/v1/dashboard/researchers
 */
export const getRecommendedResearchers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const userId = req.user._id;

    const recommendations = await feedService.getRecommendedResearchers(userId, page, limit);

    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Trending Publications
 * GET /api/v1/feed/trending OR GET /api/v1/dashboard/trending
 */
export const getTrendingPublications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const publications = await Publication.find({ isDeleted: { $ne: true } })
      .sort({ citationCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      results: publications.length,
      publications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Dashboard Home Summary Details (Metrics, completion rate, alerts)
 * GET /api/v1/dashboard/home
 */
export const getDashboardHome = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Load profile
    const profile = await Profile.findOne({ user: userId }).lean();
    if (!profile) {
      return next(new AppError('Profile not found for current user.', 404));
    }

    // Get notifications count
    const notificationsCount = 3; // Mock notification count
    const messagesCount = 5;      // Mock message count

    // Quick stats
    const stats = {
      profileCompletion: profile.profileCompletion || 0,
      publications: profile.publications || 0,
      citations: profile.citations || 0,
      hIndex: profile.hIndex || 0,
      i10Index: profile.i10Index || 0,
    };

    res.status(200).json({
      status: 'success',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      stats,
      notificationsCount,
      messagesCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recommended Conferences
 * GET /api/v1/dashboard/conferences
 */
export const getRecommendedConferences = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let feedCache = await ResearchFeed.findOne({ user: userId });

    if (!feedCache || feedCache.expiresAt < new Date()) {
      feedCache = await feedService.rebuildPersonalizedFeed(userId);
    }

    res.status(200).json({
      status: 'success',
      results: feedCache.recommendedConferences?.length || 0,
      conferences: feedCache.recommendedConferences || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Suggested Research Jobs
 * GET /api/v1/dashboard/jobs
 */
export const getDashboardJobs = async (req, res, next) => {
  try {
    // Generate mock research jobs based on user role or general academic titles
    const jobs = [
      {
        id: 'job1',
        title: 'Postdoctoral Fellow in Trustworthy AI',
        institution: 'Stanford University',
        location: 'Stanford, CA (Hybrid)',
        link: 'https://stanford.edu/jobs/postdoc-trust-ai',
        salaryRange: '$75,000 - $90,000',
      },
      {
        id: 'job2',
        title: 'Assistant Professor in Natural Language Processing',
        institution: 'Massachusetts Institute of Technology',
        location: 'Cambridge, MA (On-site)',
        link: 'https://mit.edu/careers/nlp-assistant-professor',
        salaryRange: '$110,000 - $130,000',
      },
      {
        id: 'job3',
        title: 'Senior Research Scientist - Computer Vision',
        institution: 'Google Research',
        location: 'Mountain View, CA (Hybrid)',
        link: 'https://google.com/careers/research-cv',
        salaryRange: '$180,000 - $220,000',
      },
    ];

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};
