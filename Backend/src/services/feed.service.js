import Publication from '../models/Publication.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationKeyword from '../models/PublicationKeyword.js';
import PublicationResearchArea from '../models/PublicationResearchArea.js';
import UserKeyword from '../models/UserKeyword.js';
import UserResearchArea from '../models/UserResearchArea.js';
import Follow from '../models/Follow.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import ResearchFeed from '../models/ResearchFeed.js';

// Cache TTL constant (12 hours)
const CACHE_TTL = 12 * 60 * 60 * 1000;

/**
 * Calculate Jaccard similarity between two arrays
 */
const calculateJaccardSimilarity = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
  const set1 = new Set(arr1.map(String));
  const set2 = new Set(arr2.map(String));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return (intersection.size / union.size) * 100;
};

/**
 * Generate Recommended Journals based on User's Keywords/Research Areas
 */
const getRecommendedJournalsList = (userKeywords) => {
  const allJournals = [
    { name: 'Journal of Machine Learning Research (JMLR)', keywords: ['machine learning', 'deep learning', 'neural networks'] },
    { name: 'IEEE Transactions on Pattern Analysis and Machine Intelligence', keywords: ['computer vision', 'machine learning', 'image segmentation'] },
    { name: 'Journal of Biomedical Informatics', keywords: ['healthcare ai', 'bioinformatics', 'clinical decision support'] },
    { name: 'IEEE Transactions on Information Forensics and Security', keywords: ['cyber security', 'cryptography', 'zero trust'] },
    { name: 'Nature Machine Intelligence', keywords: ['artificial intelligence', 'machine learning', 'deep learning'] },
    { name: 'Bioinformatics', keywords: ['bioinformatics', 'data science'] },
    { name: 'ACM Transactions on Computer Systems', keywords: ['quantum computing', 'cyber security'] }
  ];

  const matched = allJournals.filter(j => 
    j.keywords.some(k => userKeywords.some(uk => uk.toLowerCase().includes(k)))
  ).map(j => j.name);

  // Return matching journals or general fallback journals
  return matched.length > 0 ? matched : [
    'Nature Machine Intelligence',
    'Journal of Machine Learning Research (JMLR)',
    'IEEE Transactions on Pattern Analysis and Machine Intelligence'
  ];
};

/**
 * Generate Recommended Conferences based on User's Keywords/Research Areas
 */
const getRecommendedConferencesList = (userKeywords) => {
  const allConferences = [
    {
      name: 'NeurIPS 2026 (Conference on Neural Information Processing Systems)',
      date: new Date('2026-12-07'),
      submissionDeadline: new Date('2026-05-15'),
      link: 'https://neurips.cc',
      keywords: ['neural networks', 'machine learning', 'deep learning', 'transformer models', 'large language models']
    },
    {
      name: 'ICML 2026 (International Conference on Machine Learning)',
      date: new Date('2026-07-12'),
      submissionDeadline: new Date('2026-02-05'),
      link: 'https://icml.cc',
      keywords: ['machine learning', 'deep learning', 'reinforcement learning']
    },
    {
      name: 'CVPR 2026 (Conference on Computer Vision and Pattern Recognition)',
      date: new Date('2026-06-14'),
      submissionDeadline: new Date('2025-11-15'),
      link: 'https://cvpr.thecvf.com',
      keywords: ['computer vision', 'image segmentation']
    },
    {
      name: 'USENIX Security 2026',
      date: new Date('2026-08-12'),
      submissionDeadline: new Date('2026-01-22'),
      link: 'https://www.usenix.org/conference/usenixsecurity26',
      keywords: ['cyber security', 'cryptography', 'zero trust', 'anomaly detection']
    },
    {
      name: 'ISMB 2026 (Intelligent Systems for Molecular Biology)',
      date: new Date('2026-07-10'),
      submissionDeadline: new Date('2026-01-15'),
      link: 'https://www.iscb.org/ismb2026',
      keywords: ['bioinformatics', 'healthcare ai']
    }
  ];

  const matched = allConferences.filter(c =>
    c.keywords.some(k => userKeywords.some(uk => uk.toLowerCase().includes(k)))
  );

  return matched.length > 0 ? matched : [
    {
      name: 'NeurIPS 2026',
      date: new Date('2026-12-07'),
      submissionDeadline: new Date('2026-05-15'),
      link: 'https://neurips.cc'
    },
    {
      name: 'ICML 2026',
      date: new Date('2026-07-12'),
      submissionDeadline: new Date('2026-02-05'),
      link: 'https://icml.cc'
    }
  ];
};

/**
 * Rebuild the recommendation feed from scratch and cache it
 */
export const rebuildPersonalizedFeed = async (userId) => {
  console.log(`🔄 Rebuilding personalized recommendation feed cache for user: ${userId}`);

  // 1. Get current user's keywords and research areas
  const userKeywords = await UserKeyword.find({ user: userId }).populate('keyword').lean();
  const userKeywordIds = userKeywords.map((k) => k.keyword._id.toString());
  const userKeywordNames = userKeywords.map((k) => k.keyword.keyword);

  const userAreas = await UserResearchArea.find({ user: userId }).populate('researchArea').lean();
  const userAreaIds = userAreas.map((a) => a.researchArea._id.toString());

  // 2. Get researchers followed by current user for network score
  const followings = await Follow.find({ followerId: userId }).select('followingId').lean();
  const followingIds = followings.map((f) => f.followingId.toString());

  // 3. Fetch all active publications (excluding deleted ones)
  const query = { isDeleted: { $ne: true } };
  const publications = await Publication.find(query).lean();

  let recommendedPublications = [];
  if (publications.length > 0) {
    const pubIds = publications.map((p) => p._id);
    
    // Batch query keywords, research areas, and authors for publications to avoid N+1 queries
    const pubKeywords = await PublicationKeyword.find({ publication: { $in: pubIds } }).lean();
    const pubAreas = await PublicationResearchArea.find({ publication: { $in: pubIds } }).lean();
    const pubAuthors = await PublicationAuthor.find({ publication: { $in: pubIds } }).lean();

    // Create lookup maps
    const keywordMap = {};
    const areaMap = {};
    const authorMap = {};

    pubKeywords.forEach((pk) => {
      const key = pk.publication.toString();
      if (!keywordMap[key]) keywordMap[key] = [];
      keywordMap[key].push(pk.keyword.toString());
    });

    pubAreas.forEach((pa) => {
      const key = pa.publication.toString();
      if (!areaMap[key]) areaMap[key] = [];
      areaMap[key].push(pa.researchArea.toString());
    });

    pubAuthors.forEach((pauth) => {
      const key = pauth.publication.toString();
      if (!authorMap[key]) authorMap[key] = [];
      if (pauth.user) {
        authorMap[key].push(pauth.user.toString());
      }
    });

    // Score each publication
    const scoredPublications = publications.map((pub) => {
      const pubIdStr = pub._id.toString();
      const pkList = keywordMap[pubIdStr] || [];
      const paList = areaMap[pubIdStr] || [];
      const pAuthorList = authorMap[pubIdStr] || [];

      // Calculate Keyword Jaccard Similarity (40% Weight)
      const keywordScore = calculateJaccardSimilarity(userKeywordIds, pkList);

      // Calculate Research Area Jaccard Similarity (25% Weight)
      const researchAreaScore = calculateJaccardSimilarity(userAreaIds, paList);

      // Calculate Network Score (10% Weight)
      let networkScore = 0;
      const publisherIdStr = pub.user ? pub.user.toString() : '';
      const followedAuthor = pAuthorList.some((authId) => followingIds.includes(authId));
      if (followingIds.includes(publisherIdStr) || followedAuthor) {
        networkScore = 100;
      }

      // Calculate Trending Score (5% Weight)
      // Logarithmic citation scaling to keep trending score balanced
      const citationScore = Math.min((Math.log( (pub.citationCount || 0) + 1 ) / Math.log(51)) * 100, 100);

      // Publication Similarity (20% Weight)
      let pubSimilarityScore = 0;
      if (pub.user.toString() === userId.toString()) {
        pubSimilarityScore = 20; // Lower priority for own paper
      } else {
        const sharedAuthors = pAuthorList.some((authId) => authId === userId.toString());
        if (sharedAuthors) {
          pubSimilarityScore = 100;
        }
      }

      // Final score formula: 40% Keyword, 25% Area, 20% Pub Similarity, 10% Network, 5% Citation
      const score = parseFloat(
        (
          keywordScore * 0.40 +
          researchAreaScore * 0.25 +
          pubSimilarityScore * 0.20 +
          networkScore * 0.10 +
          citationScore * 0.05
        ).toFixed(2)
      );

      return {
        publication: pub._id,
        score,
        breakdown: {
          keywordScore,
          researchAreaScore,
          pubSimilarityScore,
          networkScore,
          citationScore
        }
      };
    });

    // Filter out zero-score or low-score items if there are better ones, and sort
    scoredPublications.sort((a, b) => b.score - a.score);
    recommendedPublications = scoredPublications;
  }

  // 4. Score Recommended Researchers (50% Keyword, 50% Research Area)
  const users = await User.find({ _id: { $ne: userId }, isDeleted: { $ne: true } }).lean();
  const profiles = await Profile.find({ user: { $ne: userId } }).lean();

  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  const candidates = users.filter((u) => profileMap[u._id.toString()]);
  let recommendedResearchers = [];

  if (candidates.length > 0) {
    const candidateIds = candidates.map((c) => c._id);
    const candKeywords = await UserKeyword.find({ user: { $in: candidateIds } }).lean();
    const candAreas = await UserResearchArea.find({ user: { $in: candidateIds } }).lean();

    const cKeywordMap = {};
    const cAreaMap = {};

    candKeywords.forEach((ck) => {
      const key = ck.user.toString();
      if (!cKeywordMap[key]) cKeywordMap[key] = [];
      cKeywordMap[key].push(ck.keyword.toString());
    });

    candAreas.forEach((ca) => {
      const key = ca.user.toString();
      if (!cAreaMap[key]) cAreaMap[key] = [];
      cAreaMap[key].push(ca.researchArea.toString());
    });

    const scoredResearchers = candidates.map((cand) => {
      const candIdStr = cand._id.toString();
      const ckList = cKeywordMap[candIdStr] || [];
      const caList = cAreaMap[candIdStr] || [];

      const keywordScore = calculateJaccardSimilarity(userKeywordIds, ckList);
      const researchAreaScore = calculateJaccardSimilarity(userAreaIds, caList);

      const finalMatch = parseFloat((keywordScore * 0.50 + researchAreaScore * 0.50).toFixed(2));
      const sharedFieldsCount = ckList.filter((k) => userKeywordIds.includes(k)).length;

      return {
        researcher: cand._id,
        score: finalMatch,
        sharedFieldsCount
      };
    });

    scoredResearchers.sort((a, b) => b.score - a.score);
    recommendedResearchers = scoredResearchers;
  }

  // 5. Generate Recommended Journals and Conferences
  const recommendedJournals = getRecommendedJournalsList(userKeywordNames);
  const recommendedConferences = getRecommendedConferencesList(userKeywordNames);

  // 6. Save or Update ResearchFeed cache entry
  const expiresAt = new Date(Date.now() + CACHE_TTL);

  const feedCache = await ResearchFeed.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        recommendedPublications,
        recommendedResearchers,
        recommendedJournals,
        recommendedConferences,
        generatedAt: new Date(),
        expiresAt
      }
    },
    { upsert: true, new: true }
  );

  return feedCache;
};

/**
 * Retrieve personalized feed cache. If cache does not exist or has expired, it rebuilds it.
 */
export const getPersonalizedFeed = async (userId, page = 1, limit = 10) => {
  let feedCache = await ResearchFeed.findOne({ user: userId });

  // Rebuild if cache is missing or expired
  if (!feedCache || !feedCache.expiresAt || feedCache.expiresAt < new Date()) {
    feedCache = await rebuildPersonalizedFeed(userId);
  }

  // Paginate publications recommendations manually from cached entries
  const publicationsList = feedCache.recommendedPublications || [];
  const startIndex = (page - 1) * limit;
  const paginatedPubs = publicationsList.slice(startIndex, startIndex + limit);

  // Retrieve full publication details
  const pubIds = paginatedPubs.map(p => p.publication);
  const publications = await Publication.find({ _id: { $in: pubIds } }).lean();

  // Map scores and match breakdowns back to populated publications
  const pubDetailMap = {};
  publications.forEach(p => {
    pubDetailMap[p._id.toString()] = p;
  });

  const formattedPubs = paginatedPubs
    .map(p => {
      const pubDetail = pubDetailMap[p.publication.toString()];
      if (!pubDetail) return null;
      return {
        ...pubDetail,
        score: p.score,
        matchBreakdown: p.breakdown
      };
    })
    .filter(Boolean);

  return {
    publications: formattedPubs,
    hasMore: publicationsList.length > startIndex + limit,
    totalRecommendations: publicationsList.length
  };
};

/**
 * Retrieve recommended researchers list from cache
 */
export const getRecommendedResearchers = async (userId, page = 1, limit = 5) => {
  let feedCache = await ResearchFeed.findOne({ user: userId });

  if (!feedCache || feedCache.expiresAt < new Date()) {
    feedCache = await rebuildPersonalizedFeed(userId);
  }

  const researchersList = feedCache.recommendedResearchers || [];
  const startIndex = (page - 1) * limit;
  const paginatedRes = researchersList.slice(startIndex, startIndex + limit);

  const resIds = paginatedRes.map(r => r.researcher);
  const users = await User.find({ _id: { $in: resIds } }).lean();
  const profiles = await Profile.find({ user: { $in: resIds } }).lean();

  const userMap = {};
  users.forEach(u => {
    userMap[u._id.toString()] = u;
  });

  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.user.toString()] = p;
  });

  const recommendations = paginatedRes
    .map(r => {
      const userIdStr = r.researcher.toString();
      const u = userMap[userIdStr];
      const p = profileMap[userIdStr];
      if (!u) return null;
      return {
        user: {
          _id: u._id,
          fullName: u.fullName,
          email: u.email,
          role: u.role
        },
        profile: p || null,
        finalMatch: r.score,
        sharedFieldsCount: r.sharedFieldsCount
      };
    })
    .filter(Boolean);

  return recommendations;
};

/**
 * Invalidate cached feed (e.g. when keywords or publications are modified)
 */
export const invalidateFeedCache = async (userId) => {
  console.log(`🗑️ Invalidating feed cache for user: ${userId}`);
  await ResearchFeed.deleteOne({ user: userId });
};
