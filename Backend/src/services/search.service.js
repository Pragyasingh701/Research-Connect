import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Publication from '../models/Publication.js';
import Institution from '../models/Institution.js';
import Keyword from '../models/Keyword.js';
import SearchHistory from '../models/SearchHistory.js';

/**
 * Parses and executes global unified search across Researchers, Publications, and Institutions.
 */
export async function executeGlobalSearch(query = '', limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  
  const [researchers, publications, institutions] = await Promise.all([
    // Search Researchers (via Profile & User)
    Profile.find({
      $or: [
        { displayName: searchRegex },
        { institution: searchRegex },
        { department: searchRegex },
        { designation: searchRegex }
      ]
    })
      .populate('user')
      .limit(limit),

    // Search Publications
    Publication.find({
      $or: [
        { title: searchRegex },
        { abstract: searchRegex },
        { journal: searchRegex },
        { conference: searchRegex }
      ]
    })
      .populate('user')
      .limit(limit),

    // Search Institutions
    Institution.find({
      $or: [
        { name: searchRegex },
        { country: searchRegex }
      ]
    }).limit(limit)
  ]);

  return {
    researchers,
    publications,
    institutions
  };
}

/**
 * Searches researchers with advanced filters, ranking, and sorting.
 */
export async function searchResearchers(filters = {}, sortOption = 'relevance', page = 1, limit = 10) {
  const query = {};

  // 1. Text Search / Query matching
  if (filters.query) {
    const regex = new RegExp(filters.query, 'i');
    query.$or = [
      { displayName: regex },
      { headline: regex },
      { institution: regex },
      { department: regex },
      { designation: regex }
    ];
  }

  // 2. Advanced Profile Filters
  if (filters.country) query.country = new RegExp(`^${filters.country}$`, 'i');
  if (filters.institution) query.institution = new RegExp(filters.institution, 'i');
  if (filters.department) query.department = new RegExp(filters.department, 'i');
  if (filters.designation) query.designation = new RegExp(filters.designation, 'i');
  
  if (filters.minExperience !== undefined) {
    query.experience = { $gte: Number(filters.minExperience) };
  }

  // Academic Metrics Filters
  if (filters.minPublications !== undefined) {
    query.publications = { $gte: Number(filters.minPublications) };
  }
  if (filters.minCitations !== undefined) {
    query.citations = { $gte: Number(filters.minCitations) };
  }
  if (filters.minHIndex !== undefined) {
    query.hIndex = { $gte: Number(filters.minHIndex) };
  }
  if (filters.minI10Index !== undefined) {
    query.i10Index = { $gte: Number(filters.minI10Index) };
  }

  // Verification & Profiles filters
  if (filters.orcidVerified) {
    query['socialLinks.orcid'] = { $ne: '' };
  }
  if (filters.googleScholarVerified) {
    query['socialLinks.researchgate'] = { $ne: '' }; // Fallback map
  }

  // 3. Setup Sorting
  let sort = {};
  if (sortOption === 'citations') {
    sort = { citations: -1 };
  } else if (sortOption === 'hIndex') {
    sort = { hIndex: -1 };
  } else if (sortOption === 'publications') {
    sort = { publications: -1 };
  } else if (sortOption === 'experience') {
    sort = { experience: -1 };
  } else {
    // Default: relevance / profileCompletion
    sort = { profileCompletion: -1, citations: -1 };
  }

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Profile.find(query)
      .populate('user')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Profile.countDocuments(query)
  ]);

  return {
    results,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Searches publications with advanced filters and sorting.
 */
export async function searchPublications(filters = {}, sortOption = 'relevance', page = 1, limit = 10) {
  const query = {};

  // 1. Text Query
  if (filters.query) {
    const regex = new RegExp(filters.query, 'i');
    query.$or = [
      { title: regex },
      { subtitle: regex },
      { abstract: regex },
      { journal: regex },
      { conference: regex }
    ];
  }

  // 2. Metadata Filters
  if (filters.publicationType) query.publicationType = filters.publicationType;
  if (filters.journal) query.journal = new RegExp(filters.journal, 'i');
  if (filters.conference) query.conference = new RegExp(filters.conference, 'i');
  if (filters.publisher) query.publisher = new RegExp(filters.publisher, 'i');
  if (filters.year) query.publicationYear = Number(filters.year);
  if (filters.doi) query.doi = filters.doi;
  if (filters.language) query.language = new RegExp(`^${filters.language}$`, 'i');
  
  if (filters.openAccess) {
    query.license = { $in: ['CC-BY-4.0', 'CC-BY-SA', 'Open-Access'] };
  }

  // 3. Sorting
  let sort = {};
  if (sortOption === 'newest') {
    sort = { publicationYear: -1, publicationDate: -1 };
  } else if (sortOption === 'oldest') {
    sort = { publicationYear: 1, publicationDate: 1 };
  } else if (sortOption === 'citations') {
    sort = { citationCount: -1 };
  } else {
    // Default: relevance / citationCount
    sort = { citationCount: -1 };
  }

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Publication.find(query)
      .populate('user')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Publication.countDocuments(query)
  ]);

  return {
    results,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Searches institutions.
 */
export async function searchInstitutions(filters = {}, page = 1, limit = 10) {
  const query = {};

  if (filters.query) {
    const regex = new RegExp(filters.query, 'i');
    query.$or = [
      { name: regex },
      { country: regex },
      { description: regex }
    ];
  }

  if (filters.country) query.country = new RegExp(`^${filters.country}$`, 'i');
  if (filters.type) query.type = filters.type;

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Institution.find(query)
      .sort({ ranking: 1, 'stats.publicationsCount': -1 })
      .skip(skip)
      .limit(limit),
    Institution.countDocuments(query)
  ]);

  return {
    results,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Generates search suggestions for autocomplete.
 */
export async function getSearchSuggestions(partialQuery = '', limit = 8) {
  if (!partialQuery) return [];
  const regex = new RegExp(partialQuery, 'i');

  const [keywords, profiles, publications, institutions] = await Promise.all([
    Keyword.find({ keyword: regex }).limit(3),
    Profile.find({ displayName: regex }).limit(3),
    Publication.find({ title: regex }).limit(3),
    Institution.find({ name: regex }).limit(2)
  ]);

  const suggestions = [];

  keywords.forEach(k => suggestions.push({ type: 'keyword', text: k.keyword }));
  profiles.forEach(p => suggestions.push({ type: 'researcher', text: p.displayName, id: p.user }));
  publications.forEach(p => suggestions.push({ type: 'publication', text: p.title, id: p._id }));
  institutions.forEach(i => suggestions.push({ type: 'institution', text: i.name, id: i._id }));

  return suggestions.slice(0, limit);
}
