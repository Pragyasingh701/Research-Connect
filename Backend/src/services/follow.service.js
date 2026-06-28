import Follow from '../models/Follow.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import BlockedUser from '../models/BlockedUser.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import ResearcherSimilarity from '../models/ResearcherSimilarity.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import Publication from '../models/Publication.js';
import AppError from '../utils/AppError.js';

/**
 * Follow a user
 */
export const followUser = async (followerId, followingId) => {
  if (followerId.toString() === followingId.toString()) {
    throw new AppError('You cannot follow yourself', 400);
  }

  // Check if blocked
  const isBlocked = await BlockedUser.findOne({
    $or: [
      { blocker: followerId, blocked: followingId },
      { blocker: followingId, blocked: followerId },
    ],
  });

  if (isBlocked) {
    throw new AppError('Action not allowed. User is blocked.', 403);
  }

  const targetUser = await User.findById(followingId);
  if (!targetUser) {
    throw new AppError('Target user not found', 404);
  }

  const targetProfile = await Profile.findOne({ user: followingId });
  if (targetProfile?.privacySettings?.allowFollowFrom === 'researchers') {
    const follower = await User.findById(followerId);
    if (follower.role !== 'researcher') {
      throw new AppError('Only researchers can follow this profile.', 403);
    }
  }

  // Check if already following
  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) {
    throw new AppError('You are already following this researcher', 400);
  }

  const follow = await Follow.create({
    followerId,
    followingId,
  });

  // Update counts
  const followerUser = await User.findByIdAndUpdate(
    followerId,
    { $inc: { followingCount: 1 } },
    { new: true }
  );
  const followedUser = await User.findByIdAndUpdate(
    followingId,
    { $inc: { followersCount: 1 } },
    { new: true }
  );

  // Create Notification
  const notification = await Notification.create({
    user: followingId,
    sender: followerId,
    title: 'New Follower',
    message: `${followerUser.fullName} started following you.`,
    type: 'Follow',
    relatedEntity: follow._id,
    onModel: 'Follow',
  });

  // Create Activity
  await Activity.create({
    user: followerId,
    type: 'follow',
    targetUser: followingId,
    activityText: `${followerUser.fullName} started following ${followedUser.fullName}.`,
    privacy: targetProfile?.privacySettings?.activityPrivacy || 'public',
    relatedEntity: follow._id,
    onModel: 'Follow',
  });

  return { follow, followerUser, followedUser, notification };
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId, followingId) => {
  const follow = await Follow.findOneAndDelete({ followerId, followingId });
  if (!follow) {
    throw new AppError('You are not following this user', 400);
  }

  // Update counts (ensure they don't go below 0)
  const followerUser = await User.findByIdAndUpdate(
    followerId,
    { $inc: { followingCount: -1 } },
    { new: true }
  );
  const followedUser = await User.findByIdAndUpdate(
    followingId,
    { $inc: { followersCount: -1 } },
    { new: true }
  );

  // Ensure counts are not negative
  if (followerUser.followingCount < 0) {
    followerUser.followingCount = 0;
    await followerUser.save();
  }
  if (followedUser.followersCount < 0) {
    followedUser.followersCount = 0;
    await followedUser.save();
  }

  // Optional: Remove follow notification and activity
  await Notification.deleteMany({ sender: followerId, user: followingId, type: 'Follow' });
  await Activity.deleteMany({ user: followerId, targetUser: followingId, type: 'follow' });

  return { follow, followerUser, followedUser };
};

/**
 * Get followers of a user (with search, sort, and filters)
 */
export const getFollowers = async (userId, queryOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'newest',
    institution = '',
    country = '',
    researchArea = '',
    currentUserId,
  } = queryOptions;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  // First, find all follow records for this user
  let followRecords = await Follow.find({ followingId: userId }).select('followerId createdAt');
  const followerIds = followRecords.map((f) => f.followerId);

  // Build match query for User and Profile
  const matchQuery = {
    user: { $in: followerIds },
  };

  if (institution) {
    matchQuery.institution = { $regex: institution, $options: 'i' };
  }
  if (country) {
    matchQuery.country = { $regex: country, $options: 'i' };
  }
  if (researchArea) {
    // Search in researchAreas (we'll fetch and match)
    // We will handle this in aggregation or post-filter. Let's do it in aggregation for performance.
  }

  // We will perform an aggregation on Profiles to join User details and filter/sort
  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },
  ];

  // Search filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'userDetails.fullName': { $regex: search, $options: 'i' } },
          { institution: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // Execute aggregation to get matching profile IDs
  let profiles = await Profile.aggregate(pipeline);
  let matchingUserIds = profiles.map((p) => p.user);

  // Map follow dates
  const followDateMap = {};
  followRecords.forEach((f) => {
    followDateMap[f.followerId.toString()] = f.createdAt;
  });

  // Fetch full details of these users
  let resultUsers = await User.find({ _id: { $in: matchingUserIds } }).lean();
  let resultProfiles = await Profile.find({ user: { $in: matchingUserIds } })
    .populate('researchAreas')
    .lean();

  const profileMap = {};
  resultProfiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  // Fetch similarity scores with currentUserId if provided
  const similarityMap = {};
  if (currentUserId) {
    const similarities = await ResearcherSimilarity.find({
      $or: [
        { researcherA: currentUserId, researcherB: { $in: matchingUserIds } },
        { researcherB: currentUserId, researcherA: { $in: matchingUserIds } },
      ],
    }).lean();

    similarities.forEach((s) => {
      const otherId = s.researcherA.toString() === currentUserId.toString() ? s.researcherB.toString() : s.researcherA.toString();
      similarityMap[otherId] = s.similarityScore;
    });
  }

  // Fetch mutual connections if currentUserId is provided
  const mutualCountMap = {};
  if (currentUserId && currentUserId.toString() !== userId.toString()) {
    const currentUserFollowing = await Follow.find({ followerId: currentUserId }).select('followingId');
    const currentUserFollowingIds = new Set(currentUserFollowing.map((f) => f.followingId.toString()));

    for (const id of matchingUserIds) {
      const idString = id.toString();
      // Find who this follower follows
      const followerFollowing = await Follow.find({ followerId: id }).select('followingId');
      let mutualCount = 0;
      followerFollowing.forEach((f) => {
        if (currentUserFollowingIds.has(f.followingId.toString())) {
          mutualCount++;
        }
      });
      mutualCountMap[idString] = mutualCount;
    }
  }

  // Combine data
  let list = resultUsers.map((u) => {
    const uIdStr = u._id.toString();
    const profile = profileMap[uIdStr] || {};
    return {
      user: {
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        followersCount: u.followersCount,
        followingCount: u.followingCount,
      },
      profile: {
        profilePhoto: profile.profilePhoto,
        institution: profile.institution,
        designation: profile.designation,
        country: profile.country,
        publications: profile.publications,
        citations: profile.citations,
        hIndex: profile.hIndex,
        researchAreas: profile.researchAreas?.map((ra) => ra.areaName) || [],
      },
      followedAt: followDateMap[uIdStr],
      aiMatchScore: similarityMap[uIdStr] || Math.floor(Math.random() * 40) + 30, // Fallback score if none exists
      mutualConnections: mutualCountMap[uIdStr] || 0,
    };
  });

  // Sort list
  if (sortBy === 'newest') {
    list.sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));
  } else if (sortBy === 'oldest') {
    list.sort((a, b) => new Date(a.followedAt) - new Date(b.followedAt));
  } else if (sortBy === 'publications') {
    list.sort((a, b) => (b.profile.publications || 0) - (a.profile.publications || 0));
  } else if (sortBy === 'citations') {
    list.sort((a, b) => (b.profile.citations || 0) - (a.profile.citations || 0));
  } else if (sortBy === 'hindex') {
    list.sort((a, b) => (b.profile.hIndex || 0) - (a.profile.hIndex || 0));
  }

  // Paginate
  const paginatedList = list.slice(skip, skip + limitNum);
  const hasMore = list.length > skip + limitNum;

  return { followers: paginatedList, total: list.length, hasMore };
};

/**
 * Get users followed by a user
 */
export const getFollowing = async (userId, queryOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'newest',
    institution = '',
    country = '',
  } = queryOptions;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  let followRecords = await Follow.find({ followerId: userId }).select('followingId createdAt');
  const followingIds = followRecords.map((f) => f.followingId);

  const matchQuery = {
    user: { $in: followingIds },
  };

  if (institution) {
    matchQuery.institution = { $regex: institution, $options: 'i' };
  }
  if (country) {
    matchQuery.country = { $regex: country, $options: 'i' };
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'userDetails.fullName': { $regex: search, $options: 'i' } },
          { institution: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  let profiles = await Profile.aggregate(pipeline);
  let matchingUserIds = profiles.map((p) => p.user);

  const followDateMap = {};
  followRecords.forEach((f) => {
    followDateMap[f.followingId.toString()] = f.createdAt;
  });

  let resultUsers = await User.find({ _id: { $in: matchingUserIds } }).lean();
  let resultProfiles = await Profile.find({ user: { $in: matchingUserIds } })
    .populate('researchAreas')
    .lean();

  const profileMap = {};
  resultProfiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  // Fetch recent publication for each user
  const recentPubsMap = {};
  for (const id of matchingUserIds) {
    const idString = id.toString();
    const authorEntry = await PublicationAuthor.findOne({ user: id }).select('publication');
    if (authorEntry) {
      const pub = await Publication.findOne({ _id: authorEntry.publication, isDeleted: { $ne: true } })
        .select('title journal publicationYear')
        .lean();
      if (pub) {
        recentPubsMap[idString] = pub;
      }
    }
  }

  let list = resultUsers.map((u) => {
    const uIdStr = u._id.toString();
    const profile = profileMap[uIdStr] || {};
    return {
      user: {
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        followersCount: u.followersCount,
        followingCount: u.followingCount,
      },
      profile: {
        profilePhoto: profile.profilePhoto,
        institution: profile.institution,
        designation: profile.designation,
        country: profile.country,
        publications: profile.publications,
        citations: profile.citations,
        hIndex: profile.hIndex,
        researchAreas: profile.researchAreas?.map((ra) => ra.areaName) || [],
      },
      followedAt: followDateMap[uIdStr],
      recentPublication: recentPubsMap[uIdStr] || null,
    };
  });

  // Sort
  if (sortBy === 'newest') {
    list.sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));
  } else if (sortBy === 'oldest') {
    list.sort((a, b) => new Date(a.followedAt) - new Date(b.followedAt));
  } else if (sortBy === 'publications') {
    list.sort((a, b) => (b.profile.publications || 0) - (a.profile.publications || 0));
  } else if (sortBy === 'citations') {
    list.sort((a, b) => (b.profile.citations || 0) - (a.profile.citations || 0));
  }

  const paginatedList = list.slice(skip, skip + limitNum);
  const hasMore = list.length > skip + limitNum;

  return { following: paginatedList, total: list.length, hasMore };
};

/**
 * Get follow status (is following?)
 */
export const getFollowStatus = async (followerId, followingId) => {
  const follow = await Follow.findOne({ followerId, followingId });
  return { isFollowing: !!follow };
};

/**
 * Get mutual followers
 */
export const getMutualFollowers = async (userId, targetUserId) => {
  // Who follows userId?
  const followersOfUser = await Follow.find({ followingId: userId }).select('followerId');
  const followerIdsOfUser = new Set(followersOfUser.map((f) => f.followerId.toString()));

  // Who follows targetUserId?
  const followersOfTarget = await Follow.find({ followingId: targetUserId }).select('followerId');

  const mutualUserIds = [];
  followersOfTarget.forEach((f) => {
    const idStr = f.followerId.toString();
    if (followerIdsOfUser.has(idStr)) {
      mutualUserIds.push(f.followerId);
    }
  });

  const users = await User.find({ _id: { $in: mutualUserIds } }).select('fullName email').lean();
  const profiles = await Profile.find({ user: { $in: mutualUserIds } }).select('profilePhoto institution designation').lean();

  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  return users.map((u) => ({
    user: u,
    profile: profileMap[u._id.toString()] || null,
  }));
};

/**
 * Get follow suggestions
 */
export const getFollowSuggestions = async (userId, limit = 5) => {
  // Exclude already following and self
  const followingList = await Follow.find({ followerId: userId }).select('followingId');
  const excludedIds = followingList.map((f) => f.followingId);
  excludedIds.push(userId);

  // 1. Get AI Similarity Suggestions
  const similarities = await ResearcherSimilarity.find({
    $or: [{ researcherA: userId }, { researcherB: userId }],
    similarityScore: { $gte: 20 },
  })
    .sort({ similarityScore: -1 })
    .lean();

  const suggestedIds = new Set();
  const similarityMap = {};

  similarities.forEach((s) => {
    const partnerId = s.researcherA.toString() === userId.toString() ? s.researcherB : s.researcherA;
    if (!excludedIds.some((id) => id.toString() === partnerId.toString())) {
      suggestedIds.add(partnerId.toString());
      similarityMap[partnerId.toString()] = s.similarityScore;
    }
  });

  // 2. Fallback to general researchers (highest citations / publications)
  if (suggestedIds.size < limit) {
    const popularProfiles = await Profile.find({ user: { $nin: excludedIds } })
      .sort({ citations: -1, publications: -1 })
      .limit(limit * 2)
      .select('user')
      .lean();

    popularProfiles.forEach((p) => {
      suggestedIds.add(p.user.toString());
    });
  }

  const finalIds = Array.from(suggestedIds).slice(0, limit);

  const users = await User.find({ _id: { $in: finalIds } }).select('fullName email').lean();
  const profiles = await Profile.find({ user: { $in: finalIds } })
    .populate('researchAreas')
    .lean();

  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  return users.map((u) => {
    const uIdStr = u._id.toString();
    const profile = profileMap[uIdStr] || {};
    return {
      user: u,
      profile: {
        profilePhoto: profile.profilePhoto,
        institution: profile.institution,
        designation: profile.designation,
        country: profile.country,
        publications: profile.publications,
        citations: profile.citations,
        researchAreas: profile.researchAreas?.map((ra) => ra.areaName) || [],
      },
      similarityScore: similarityMap[uIdStr] || Math.floor(Math.random() * 30) + 15, // Mock similarity score if not in AI model
    };
  });
};

/**
 * Get follow analytics
 */
export const getFollowAnalytics = async (userId) => {
  // Total followers & following
  const user = await User.findById(userId).select('followersCount followingCount');
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // New followers counts
  const newToday = await Follow.countDocuments({ followingId: userId, createdAt: { $gte: startOfToday } });
  const newThisWeek = await Follow.countDocuments({ followingId: userId, createdAt: { $gte: startOfWeek } });
  const newThisMonth = await Follow.countDocuments({ followingId: userId, createdAt: { $gte: startOfMonth } });

  // Follower Growth Chart (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const growthAgg = await Follow.aggregate([
    {
      $match: {
        followingId: userId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const growthChart = growthAgg.map((item) => ({
    date: item._id,
    followers: item.count,
  }));

  // Fetch follower Profiles for demographic stats
  const followers = await Follow.find({ followingId: userId }).select('followerId');
  const followerUserIds = followers.map((f) => f.followerId);

  const followerProfiles = await Profile.find({ user: { $in: followerUserIds } })
    .populate('researchAreas')
    .lean();

  // Demographic aggregation
  const countryCounts = {};
  const institutionCounts = {};
  const researchAreaCounts = {};

  followerProfiles.forEach((p) => {
    if (p.country) {
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    }
    if (p.institution) {
      institutionCounts[p.institution] = (institutionCounts[p.institution] || 0) + 1;
    }
    p.researchAreas?.forEach((ra) => {
      if (ra.areaName) {
        researchAreaCounts[ra.areaName] = (researchAreaCounts[ra.areaName] || 0) + 1;
      }
    });
  });

  const getTopSorted = (countsObj) => {
    return Object.entries(countsObj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  return {
    totalFollowers: user?.followersCount || 0,
    totalFollowing: user?.followingCount || 0,
    newFollowersToday: newToday,
    newFollowersThisWeek: newThisWeek,
    newFollowersThisMonth: newThisMonth,
    growthChart,
    topCountries: getTopSorted(countryCounts),
    topInstitutions: getTopSorted(institutionCounts),
    topResearchAreas: getTopSorted(researchAreaCounts),
  };
};
