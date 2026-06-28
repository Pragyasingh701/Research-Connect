import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Keyword from '../models/Keyword.js';
import Publication from '../models/Publication.js';
import ResearchInterest from '../models/ResearchInterest.js';
import ResearcherSimilarity from '../models/ResearcherSimilarity.js';
import Recommendation from '../models/Recommendation.js';
import KeywordSynonym from '../models/KeywordSynonym.js';

/**
 * Calculates Jaccard similarity between two sets/arrays.
 */
function calculateJaccardSimilarity(arrA, arrB) {
  const setA = new Set(arrA.map(id => id.toString()));
  const setB = new Set(arrB.map(id => id.toString()));
  if (setA.size === 0 && setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

/**
 * Compares two sets of keywords, taking synonyms and plural/singular forms into account.
 */
export async function calculateKeywordSimilarity(keywordsA, keywordsB) {
  if (!keywordsA?.length || !keywordsB?.length) return 0;
  
  // 1. Exact match Jaccard
  const jaccard = calculateJaccardSimilarity(keywordsA, keywordsB);
  
  // 2. Synonym expansion matching
  // Fetch synonym mappings
  const synonymsMap = {};
  const allKeywordIds = [...new Set([...keywordsA, ...keywordsB])];
  const dbSynonyms = await KeywordSynonym.find({ keyword: { $in: allKeywordIds } }).populate('keyword');
  
  for (const entry of dbSynonyms) {
    if (entry.keyword) {
      synonymsMap[entry.keyword._id.toString()] = entry.synonyms.map(s => s.toLowerCase());
    }
  }
  
  // Fetch keyword strings for matching
  const keywordsData = await Keyword.find({ _id: { $in: allKeywordIds } });
  const keywordStrings = {};
  for (const kw of keywordsData) {
    keywordStrings[kw._id.toString()] = kw.keyword.toLowerCase();
  }

  let synonymMatches = 0;
  let checks = 0;

  for (const idA of keywordsA) {
    const strA = keywordStrings[idA.toString()] || '';
    const synsA = synonymsMap[idA.toString()] || [];

    for (const idB of keywordsB) {
      const strB = keywordStrings[idB.toString()] || '';
      const synsB = synonymsMap[idB.toString()] || [];

      // Check if A is synonym of B, or B is synonym of A, or they share a synonym
      const isSynonym = 
        synsA.includes(strB) || 
        synsB.includes(strA) || 
        synsA.some(s => synsB.includes(s));
      
      // Simple plural/singular heuristic (e.g., "neural network" vs "neural networks")
      const isPluralSingular = 
        strA === `${strB}s` || 
        strB === `${strA}s` || 
        strA === `${strB}es` || 
        strB === `${strA}es`;

      if (isSynonym || isPluralSingular) {
        synonymMatches++;
      }
      checks++;
    }
  }

  const synonymScore = checks > 0 ? (synonymMatches / Math.max(keywordsA.length, keywordsB.length)) : 0;

  // Combine exact Jaccard (70%) and Synonym Match (30%)
  return Math.min(100, Math.round((jaccard * 0.70 + synonymScore * 0.30) * 100));
}

/**
 * Calculates similarity between two publications.
 */
export async function calculatePublicationSimilarity(pubA, pubB) {
  if (!pubA || !pubB) return 0;
  
  // 1. Title/Abstract term overlap (simple token check)
  const titleA = new Set(pubA.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const titleB = new Set(pubB.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const titleIntersection = [...titleA].filter(x => titleB.has(x));
  const titleScore = titleA.size + titleB.size > 0 ? (titleIntersection.length / Math.min(titleA.size, titleB.size)) : 0;

  // 2. Keyword overlap
  const kwA = pubA.keywords || [];
  const kwB = pubB.keywords || [];
  const keywordScore = calculateJaccardSimilarity(kwA, kwB);

  // 3. Metadata overlap (Year, Type, Journal)
  const typeMatch = pubA.publicationType === pubB.publicationType ? 1 : 0;
  const journalMatch = (pubA.journal && pubA.journal === pubB.journal) ? 1 : 0;
  const yearDiff = Math.abs((pubA.publicationYear || 0) - (pubB.publicationYear || 0));
  const yearScore = yearDiff <= 1 ? 1 : yearDiff <= 3 ? 0.5 : 0;

  const metadataScore = (typeMatch * 0.4) + (journalMatch * 0.4) + (yearScore * 0.2);

  // Final score out of 100
  const finalScore = Math.round((titleScore * 0.4 + keywordScore * 0.4 + metadataScore * 0.2) * 100);
  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Computes the overall similarity score between two researchers.
 */
export async function computeResearcherSimilarity(userIdA, userIdB) {
  if (userIdA.toString() === userIdB.toString()) return null;

  // 1. Fetch profiles and interests
  const [profileA, profileB, interestA, interestB] = await Promise.all([
    Profile.findOne({ user: userIdA }),
    Profile.findOne({ user: userIdB }),
    ResearchInterest.findOne({ user: userIdA }),
    ResearchInterest.findOne({ user: userIdB })
  ]);

  if (!profileA || !profileB) return null;

  // 2. Keyword Similarity
  const kwA = interestA?.keywords || [];
  const kwB = interestB?.keywords || [];
  const keywordMatchScore = await calculateKeywordSimilarity(kwA, kwB);

  // 3. Domain Similarity
  const domA = interestA?.domains || [];
  const domB = interestB?.domains || [];
  const domainScore = Math.round(calculateJaccardSimilarity(domA, domB) * 100);

  // 4. Publication Similarity
  const [pubsA, pubsB] = await Promise.all([
    Publication.find({ user: userIdA }),
    Publication.find({ user: userIdB })
  ]);

  let pubSimSum = 0;
  let pubSimCount = 0;
  let coauthorship = 0;

  for (const pA of pubsA) {
    for (const pB of pubsB) {
      const sim = await calculatePublicationSimilarity(pA, pB);
      if (sim > 40) {
        pubSimSum += sim;
        pubSimCount++;
      }
      // Simple coauthorship check (if they share the same title or DOI)
      if (pA.title.toLowerCase() === pB.title.toLowerCase() || (pA.doi && pA.doi === pB.doi)) {
        coauthorship = 100;
      }
    }
  }

  const publicationSimilarityScore = pubSimCount > 0 ? Math.round(pubSimSum / pubSimCount) : 0;

  // 5. Institution and Experience
  const institutionScore = (profileA.institution && profileA.institution === profileB.institution) ? 100 : 0;
  const expDiff = Math.abs((profileA.experience || 0) - (profileB.experience || 0));
  const experienceScore = Math.max(0, 100 - (expDiff * 10));

  // 6. Combine using ranking formula
  // Formula: 30% Keyword + 25% Domain + 20% Publication + 10% Coauthorship + 10% Experience + 5% Institution
  const finalScore = Math.round(
    (keywordMatchScore * 0.30) +
    (domainScore * 0.25) +
    (publicationSimilarityScore * 0.20) +
    (coauthorship * 0.10) +
    (experienceScore * 0.10) +
    (institutionScore * 0.05)
  );

  return {
    similarityScore: Math.min(100, finalScore),
    breakdown: {
      keywordMatchScore,
      publicationSimilarityScore,
      semanticScore: keywordMatchScore, // Semantic is baked into keywordSynonyms
      coauthorshipScore: coauthorship,
      experienceScore,
      institutionScore
    },
    commonKeywords: kwA.filter(id => kwB.map(b => b.toString()).includes(id.toString()))
  };
}

/**
 * Calculates and caches similarities and recommendations for a researcher.
 */
export async function updateRecommendationsForResearcher(userId) {
  const allUsers = await User.find({ _id: { $ne: userId }, role: 'researcher' });
  const recommendations = [];

  for (const otherUser of allUsers) {
    const simResult = await computeResearcherSimilarity(userId, otherUser._id);
    if (simResult && simResult.similarityScore > 20) {
      // 1. Update/Upsert ResearcherSimilarity
      await ResearcherSimilarity.findOneAndUpdate(
        {
          $or: [
            { researcherA: userId, researcherB: otherUser._id },
            { researcherA: otherUser._id, researcherB: userId }
          ]
        },
        {
          researcherA: userId,
          researcherB: otherUser._id,
          similarityScore: simResult.similarityScore,
          breakdown: simResult.breakdown,
          commonKeywords: simResult.commonKeywords
        },
        { upsert: true, new: true }
      );

      // 2. Add to Recommendation list
      recommendations.push({
        researcher: userId,
        recommendedResearcher: otherUser._id,
        keywordScore: simResult.breakdown.keywordMatchScore,
        researchAreaScore: simResult.breakdown.coauthorshipScore, // Map coauthorship to researchArea
        abstractScore: simResult.breakdown.semanticScore,
        publicationScore: simResult.breakdown.publicationSimilarityScore,
        commonKeywords: simResult.commonKeywords
      });
    }
  }

  // Clear old recommendations and insert new ones
  await Recommendation.deleteMany({ researcher: userId });
  if (recommendations.length > 0) {
    await Recommendation.insertMany(recommendations);
  }
}
