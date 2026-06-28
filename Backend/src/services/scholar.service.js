import fs from 'fs';
import Publication from '../models/Publication.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationKeyword from '../models/PublicationKeyword.js';
import PublicationResearchArea from '../models/PublicationResearchArea.js';
import Profile from '../models/Profile.js';
import AcademicProfile from '../models/AcademicProfile.js';
import ResearchMetrics from '../models/ResearchMetrics.js';
import ResearchCollaborator from '../models/ResearchCollaborator.js';
import ResearchArea from '../models/ResearchArea.js';
import UserResearchArea from '../models/UserResearchArea.js';
import Keyword from '../models/Keyword.js';
import UserKeyword from '../models/UserKeyword.js';
import ActivityLog from '../models/ActivityLog.js';
import ExternalAccount from '../models/ExternalAccount.js';
import PublicationHistory from '../models/PublicationHistory.js';
import PublicationAnalytics from '../models/PublicationAnalytics.js';
import AppError from '../utils/AppError.js';
import { updateFieldWithMetadata } from '../utils/sourceTracker.js';

// Simple in-memory cache for SerpAPI responses
const serpApiCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Extract Author ID from URL or input string
 */
export const extractAuthorId = (input) => {
  if (!input) return null;
  const trimmed = input.trim();
  
  // Check if it's a URL
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const userParam = url.searchParams.get('user');
      if (userParam) {
        return userParam;
      }
    }
  } catch (err) {
    // Treat as potential plain ID
  }

  // Check if it matches Google Scholar ID format (12 characters, e.g. LsR1t3AAAAAJ) or a mock ID
  const idRegex = /^[a-zA-Z0-9_-]{8,30}$/;
  if (idRegex.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Fetch Profiles by Name (Search Fallback)
 */
export const searchAuthorByName = async (name) => {
  const getMockSearchData = () => [
    {
      name: 'Dr. Sarah Jenkins',
      authorId: 'sarah_gs_id',
      affiliations: 'Associate Professor, Stanford University',
      email: 'Verified email at stanford.edu',
      thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      interests: ['Neural Networks', 'Natural Language Processing', 'Healthcare AI']
    },
    {
      name: 'Prof. Alex Rivera',
      authorId: 'alex_gs_id',
      affiliations: 'CSAIL, MIT',
      email: 'Verified email at mit.edu',
      thumbnail: '',
      interests: ['Machine Learning', 'Computer Vision']
    }
  ];

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SERP_API_KEY is not defined in environment variables. Returning mock profiles.');
    return getMockSearchData();
  }

  const url = `https://serpapi.com/search.json?engine=google_scholar_profiles&mauthors=${encodeURIComponent(name)}&api_key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ SerpAPI returned status ${response.status}. Returning mock profiles.`);
      return getMockSearchData();
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`⚠️ SerpAPI Error: ${data.error}. Returning mock profiles.`);
      return getMockSearchData();
    }

    const profiles = data.profiles || [];
    return profiles.map((p) => ({
      name: p.name,
      authorId: p.author_id,
      affiliations: p.affiliations,
      email: p.email,
      thumbnail: p.thumbnail,
      interests: p.interests ? p.interests.map((i) => i.title) : [],
    }));
  } catch (error) {
    console.warn(`⚠️ Failed to fetch author profiles: ${error.message}. Returning mock profiles.`);
    return getMockSearchData();
  }
};

/**
 * Query SerpAPI with local caching
 */
const fetchAuthorDetailsFromAPI = async (authorId) => {
  const cacheKey = `scholar_${authorId}`;
  const cached = serpApiCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log('⚡ Loading Scholar API payload from in-memory cache...');
    return cached.data;
  }

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SERP_API_KEY is missing. Falling back to Mock Scholar Data.');
    return getMockScholarData(authorId);
  }

  const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${authorId}&api_key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Google Scholar API returned status ${response.status}. Falling back to Mock Scholar Data.`);
      return getMockScholarData(authorId);
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`⚠️ Google Scholar API Error: ${data.error}. Falling back to Mock Scholar Data.`);
      return getMockScholarData(authorId);
    }

    // Save to cache
    serpApiCache.set(cacheKey, {
      timestamp: Date.now(),
      data,
    });

    return data;
  } catch (error) {
    console.warn(`⚠️ Google Scholar fetch failed: ${error.message}. Falling back to Mock Scholar Data.`);
    return getMockScholarData(authorId);
  }
};

/**
 * Fetch Scholar Import Preview
 */
export const getScholarImportPreview = async (input) => {
  let authorId = extractAuthorId(input);
  
  // If not a valid ID, assume it's a name and search for the author ID
  if (!authorId) {
    const matches = await searchAuthorByName(input);
    if (matches.length === 0) {
      throw new AppError(`No researcher profiles found for name: "${input}"`, 404);
    }
    // Return search matches list so user can choose which one to preview
    return { type: 'search_results', profiles: matches };
  }

  const data = await fetchAuthorDetailsFromAPI(authorId);
  
  const authorInfo = data.author || {};
  const articles = data.articles || [];
  const citationsInfo = data.cited_by || {};
  const coauthors = data.co_authors || [];

  // Parse metrics
  const citationsTable = citationsInfo.table || [];
  const citationsAll = citationsTable[0]?.citations?.all || 0;
  const citationsRecent = citationsTable[0]?.citations?.since_2021 || citationsTable[0]?.citations?.since_2019 || 0;
  const hIndexAll = citationsTable[1]?.h_index?.all || 0;
  const hIndexRecent = citationsTable[1]?.h_index?.since_2021 || citationsTable[1]?.h_index?.since_2019 || 0;
  const i10IndexAll = citationsTable[2]?.i10_index?.all || 0;
  const i10IndexRecent = citationsTable[2]?.i10_index?.since_2021 || citationsTable[2]?.i10_index?.since_2019 || 0;

  // Smart splitting for institution and department
  const parts = (authorInfo.affiliations || '').split(',');
  let institution = authorInfo.affiliations || '';
  let department = '';
  if (parts.length > 1) {
    department = parts[0].trim();
    institution = parts.slice(1).join(',').trim();
  }

  // Parse Email Domain
  let emailDomain = '';
  if (authorInfo.email && authorInfo.email.includes('at ')) {
    emailDomain = authorInfo.email.split('at ')[1].trim();
  }

  // Citation Trend/Graph points
  const citationsByYear = (citationsInfo.graph || []).map((pt) => ({
    year: pt.year,
    citations: pt.citations,
  }));

  return {
    type: 'profile_preview',
    authorId,
    profile: {
      fullName: authorInfo.name,
      googleScholarId: authorId,
      profileUrl: `https://scholar.google.com/citations?user=${authorId}`,
      profilePhoto: authorInfo.thumbnail || '',
      affiliation: authorInfo.affiliations || '',
      institution,
      organization: institution,
      department,
      emailDomain,
      homepage: authorInfo.website || '',
      verifiedEmailDomain: emailDomain ? `Verified email at ${emailDomain}` : '',
      interests: authorInfo.interests ? authorInfo.interests.map((i) => i.title) : [],
    },
    metrics: {
      totalPublications: articles.length,
      totalCitations: citationsAll,
      citationsSinceLastYear: citationsRecent,
      hIndex: hIndexAll,
      hIndexSinceLastYear: hIndexRecent,
      i10Index: i10IndexAll,
      i10IndexSinceLastYear: i10IndexRecent,
      totalCoAuthors: coauthors.length,
      citationsByYear,
    },
    publications: articles.map((art) => {
      // Smart PDF Detection: Find PDF link from resources or link suffixes
      const pdfResource = (art.resources || []).find(
        (r) => 
          r.file_format === 'PDF' || 
          (r.title && r.title.toLowerCase().includes('[pdf]')) || 
          (r.link && r.link.toLowerCase().endsWith('.pdf'))
      );
      let pdfUrl = pdfResource ? pdfResource.link : '';
      if (!pdfUrl && art.link && art.link.toLowerCase().endsWith('.pdf')) {
        pdfUrl = art.link;
      }
      if (!pdfUrl && art.title && art.title.toLowerCase().includes('[pdf]')) {
        if (art.resources && art.resources.length > 0) {
          pdfUrl = art.resources[0].link;
        }
      }

      // Distinguish Google Scholar Link vs Publisher Link
      const linkStr = art.link || '';
      const isScholarLink = linkStr.includes('scholar.google.com');
      const scholarUrl = isScholarLink ? linkStr : (art.cited_by?.link || '');
      const publisherUrl = !isScholarLink ? linkStr : '';

      return {
        title: art.title,
        authors: art.authors,
        journal: art.publication || '',
        publisher: art.publisher || '',
        publicationYear: art.year ? parseInt(art.year, 10) : null,
        citationCount: art.cited_by?.value || 0,
        pdfUrl,
        scholarUrl,
        publisherUrl,
        publicationUrl: linkStr,
        abstract: art.description || `${art.title}. Published in ${art.publication || 'Academic Journal'}.`,
        doi: '', // SerpAPI doesn't return DOI directly in initial list, but can be manually updated
        volume: art.volume || '',
        issue: art.issue || '',
        pages: art.pages || '',
        publicationType: (art.publication || '').toLowerCase().includes('patent') ? 'patent' : 'journal',
        thumbnail: art.thumbnail || '',
      };
    }),
    coAuthors: coauthors.map((ca) => ({
      name: ca.name,
      scholarId: ca.author_id,
      scholarUrl: ca.link,
      affiliation: ca.affiliations || '',
      thumbnail: ca.thumbnail || '',
      relationship: 'co-author',
    })),
  };
};

/**
 * Save / Import Google Scholar Data
 */
export const importGoogleScholarProfile = async (userId, authorId, selectedPubTitles = null, selectedFields = null) => {
  try {
    const data = await fetchAuthorDetailsFromAPI(authorId);

    // 1. Create/Update the ExternalAccount document with raw payload
    await ExternalAccount.findOneAndUpdate(
      { user: userId, provider: 'googleScholar' },
      {
        providerUserId: authorId,
        profileUrl: `https://scholar.google.com/citations?user=${authorId}`,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        rawResponse: data,
        importVersion: 1,
      },
      { upsert: true, new: true }
    );

    const preview = await getScholarImportPreview(authorId);

    // 2. Update Profile Information using sourceTracker helper
    const profile = await Profile.findOne({ user: userId });
    if (profile) {
      const fieldsToImport = selectedFields || ['displayName', 'institution', 'department', 'profilePhoto', 'bio', 'website'];
      
      fieldsToImport.forEach((field) => {
        if (field === 'displayName') {
          updateFieldWithMetadata(profile, 'displayName', preview.profile.fullName, 'googleScholar', userId);
        }
        if (field === 'institution' && preview.profile.institution) {
          updateFieldWithMetadata(profile, 'institution', preview.profile.institution, 'googleScholar', userId);
        }
        if (field === 'department') {
          updateFieldWithMetadata(profile, 'department', preview.profile.department, 'googleScholar', userId);
        }
        if (field === 'profilePhoto' && preview.profile.profilePhoto) {
          updateFieldWithMetadata(profile, 'profilePhoto', preview.profile.profilePhoto, 'googleScholar', userId);
        }
        if (field === 'bio') {
          updateFieldWithMetadata(profile, 'bio', preview.profile.interests.join(', '), 'googleScholar', userId);
        }
        if (field === 'website') {
          updateFieldWithMetadata(profile, 'website', preview.profile.homepage, 'googleScholar', userId);
        }
      });
      
      await profile.save();
    }

    // 3. Update Academic Profile Link
    const academicProfile = await AcademicProfile.findOne({ user: userId }) || new AcademicProfile({ user: userId });
    updateFieldWithMetadata(academicProfile, 'googleScholar', authorId, 'googleScholar', userId);
    updateFieldWithMetadata(academicProfile, 'personalWebsite', preview.profile.homepage, 'googleScholar', userId);
    academicProfile.rawScholarData = data;
    await academicProfile.save();

    // 4. Save Research Metrics
    const metrics = await ResearchMetrics.findOne({ user: userId }) || new ResearchMetrics({ user: userId });
    updateFieldWithMetadata(metrics, 'totalPublications', preview.metrics.totalPublications, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'totalCitations', preview.metrics.totalCitations, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'citationsSinceLastYear', preview.metrics.citationsSinceLastYear, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'hIndex', preview.metrics.hIndex, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'hIndexSinceLastYear', preview.metrics.hIndexSinceLastYear, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'i10Index', preview.metrics.i10Index, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'i10IndexSinceLastYear', preview.metrics.i10IndexSinceLastYear, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'totalCoAuthors', preview.metrics.totalCoAuthors, 'googleScholar', userId);
    updateFieldWithMetadata(metrics, 'citationsByYear', preview.metrics.citationsByYear, 'googleScholar', userId);
    await metrics.save();

    // 5. Save Research Interests as ResearchAreas & Keywords
    const interests = preview.profile.interests || [];
    for (const title of interests) {
      const normalizedName = title.trim();
      if (!normalizedName) continue;

      const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slug) continue;

      // Save Keyword
      const keywordDoc = await Keyword.findOneAndUpdate(
        { slug },
        { $setOnInsert: { keyword: normalizedName, slug } },
        { upsert: true, new: true }
      );
      await UserKeyword.findOneAndUpdate(
        { user: userId, keyword: keywordDoc._id },
        { 
          user: userId, 
          keyword: keywordDoc._id,
          source: 'googleScholar',
          lastUpdated: new Date(),
          updatedBy: userId,
        },
        { upsert: true }
      );

      // Save Research Area
      const areaDoc = await ResearchArea.findOneAndUpdate(
        { slug },
        { $setOnInsert: { areaName: normalizedName, slug } },
        { upsert: true, new: true }
      );
      await UserResearchArea.findOneAndUpdate(
        { user: userId, researchArea: areaDoc._id },
        { 
          user: userId, 
          researchArea: areaDoc._id,
          source: 'googleScholar',
          lastUpdated: new Date(),
          updatedBy: userId,
        },
        { upsert: true }
      );
    }

    // 6. Save Co-authors in ResearchCollaborator
    for (const ca of preview.coAuthors) {
      if (!ca.scholarId) continue;
      try {
        await ResearchCollaborator.findOneAndUpdate(
          { user: userId, scholarId: ca.scholarId },
          {
            $set: {
              name: ca.name,
              scholarUrl: ca.scholarUrl,
              affiliation: ca.affiliation,
              thumbnail: ca.thumbnail,
              relationship: ca.relationship,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.warn('⚠️ Co-author upsert skipped:', err.message);
      }
    }

    // 7. Import Publications
    console.log(`🌱 Normalizing and importing ${preview.publications.length} publications...`);
    for (const pubData of preview.publications) {
      // If selective import filter is enabled, check membership
      if (selectedPubTitles && !selectedPubTitles.includes(pubData.title)) {
        continue;
      }

      try {
        let pub = await Publication.findOne({ title: pubData.title, user: userId });
        const isNewPub = !pub;

        if (isNewPub) {
          pub = new Publication({
            user: userId,
            title: pubData.title,
            abstract: pubData.abstract,
            publisher: pubData.publisher,
            journal: pubData.journal,
            publicationYear: pubData.publicationYear || new Date().getFullYear(),
            citationCount: pubData.citationCount,
            pdfUrl: pubData.pdfUrl,
            publicationUrl: pubData.publicationUrl,
            publisherUrl: pubData.publisherUrl || '',
            scholarUrl: pubData.scholarUrl || '',
            doiUrl: pubData.doi ? `https://doi.org/${pubData.doi}` : '',
            sourceType: 'google_scholar',
            uploadedBy: userId,
            thumbnail: pubData.thumbnail || '',
            volume: pubData.volume,
            issue: pubData.issue,
            pages: pubData.pages,
            publicationType: pubData.publicationType,
            visibility: 'public',
          });
          
          // Setup initial source metadata
          updateFieldWithMetadata(pub, 'title', pubData.title, 'googleScholar', userId);
          updateFieldWithMetadata(pub, 'abstract', pubData.abstract, 'googleScholar', userId);
          updateFieldWithMetadata(pub, 'citationCount', pubData.citationCount, 'googleScholar', userId);
          
          await pub.save();

          // Create Publication Author mappings
          const authorNames = pubData.authors ? pubData.authors.split(',') : [preview.profile.fullName];
          for (let i = 0; i < authorNames.length; i++) {
            await PublicationAuthor.create({
              publication: pub._id,
              user: i === 0 ? userId : undefined, // link first author to the registered user
              authorName: authorNames[i].trim(),
              authorOrder: i + 1,
            });
          }

          // Initialize Publication Analytics
          await PublicationAnalytics.findOneAndUpdate(
            { publication: pub._id, date: new Date().setHours(0, 0, 0, 0) },
            { $setOnInsert: { views: 0, downloads: 0, reads: 0, shares: 0, recommendations: 0 } },
            { upsert: true }
          );

          // Save Publication History
          await PublicationHistory.create({
            publication: pub._id,
            user: userId,
            action: 'create',
            details: 'Imported from Google Scholar',
          });
        } else {
          // Update existing publication citations and other non-locked fields
          let updated = false;
          if (updateFieldWithMetadata(pub, 'citationCount', pubData.citationCount, 'googleScholar', userId)) {
            updated = true;
          }
          if (pubData.pdfUrl && updateFieldWithMetadata(pub, 'pdfUrl', pubData.pdfUrl, 'googleScholar', userId)) {
            updated = true;
          }
          if (pubData.publicationUrl && updateFieldWithMetadata(pub, 'publicationUrl', pubData.publicationUrl, 'googleScholar', userId)) {
            updated = true;
          }
          if (pubData.scholarUrl && pub.scholarUrl !== pubData.scholarUrl) {
            pub.scholarUrl = pubData.scholarUrl;
            updated = true;
          }
          if (pubData.publisherUrl && pub.publisherUrl !== pubData.publisherUrl) {
            pub.publisherUrl = pubData.publisherUrl;
            updated = true;
          }
          if (pubData.thumbnail && pub.thumbnail !== pubData.thumbnail) {
            pub.thumbnail = pubData.thumbnail;
            updated = true;
          }
          
          if (updated) {
            await pub.save();
            // Save Publication History
            await PublicationHistory.create({
              publication: pub._id,
              user: userId,
              action: 'update_metadata',
              details: 'Updated citation counts / files via Google Scholar Sync',
            });
          }
        }
      } catch (err) {
        console.warn(`⚠️ Skipped article import "${pubData.title}":`, err.message);
      }
    }

    // Recalculate metrics
    await Profile.recalculateMetrics(userId);

    // Log activity
    await ActivityLog.create({
      user: userId,
      activity: 'google_scholar_import',
      ipAddress: '',
    });

    return { success: true };
  } catch (error) {
    try {
      fs.writeFileSync('error-log.txt', `${new Date().toISOString()}\nError: ${error.message}\nStack: ${error.stack}\n`);
    } catch (fsErr) {
      console.error('Failed to write error-log.txt:', fsErr);
    }
    throw error;
  }
};

/**
 * Unlink Google Scholar Profile
 */
export const unlinkGoogleScholarProfile = async (userId) => {
  const academicProfile = await AcademicProfile.findOne({ user: userId });
  if (academicProfile) {
    academicProfile.googleScholar = '';
    academicProfile.rawScholarData = null;
    if (academicProfile.fieldMetadata) {
      academicProfile.fieldMetadata.delete('googleScholar');
    }
    await academicProfile.save();
  }

  await ExternalAccount.findOneAndDelete({ user: userId, provider: 'googleScholar' });
  await ResearchMetrics.findOneAndDelete({ user: userId });

  await ActivityLog.create({
    user: userId,
    activity: 'google_scholar_unlink',
  });

  return { success: true };
};

/**
 * Mock data generator if SerpAPI Key is missing
 */
function getMockScholarData(authorId) {
  return {
    author: {
      name: 'Dr. Sarah Jenkins',
      affiliations: 'Associate Professor, Stanford University',
      website: 'https://sarahjenkins.lab.stanford.edu',
      email: 'Verified email at stanford.edu',
      interests: [
        { title: 'Neural Networks' },
        { title: 'Natural Language Processing' },
        { title: 'Healthcare AI' }
      ],
      thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'
    },
    cited_by: {
      table: [
        { citations: { all: 2458, since_2021: 1542 } },
        { h_index: { all: 28, since_2021: 22 } },
        { i10_index: { all: 35, since_2021: 30 } }
      ],
      graph: [
        { year: 2021, citations: 210 },
        { year: 2022, citations: 320 },
        { year: 2023, citations: 450 },
        { year: 2024, citations: 520 },
        { year: 2025, citations: 610 },
        { year: 2026, citations: 348 }
      ]
    },
    articles: [
      {
        title: 'Attention-Driven Spatial Reasoning in Healthcare Diagnostics',
        authors: 'Sarah Jenkins, John Doe',
        publication: 'Journal of Biomedical Informatics',
        year: '2026',
        volume: '42',
        issue: '3',
        pages: '128-142',
        cited_by: { value: 128 },
        link: 'https://scholar.google.com/citations?view_op=view_citation&citation_id=attention_diagnostics',
        description: 'An optimized transformer network applied to diagnostic segmentation of 3D medical scans.',
        resources: [
          { file_format: 'PDF', link: 'https://res.cloudinary.com/research-connect/raw/upload/papers/attention_healthcare.pdf' }
        ]
      },
      {
        title: 'Secure Federated Learning in Distributed Healthcare Frameworks',
        authors: 'Alex Rivera, Sarah Jenkins',
        publication: 'IEEE Transactions on Information Forensics and Security',
        year: '2026',
        volume: '15',
        issue: '1',
        pages: '89-102',
        cited_by: { value: 15 },
        link: 'https://scholar.google.com/citations?view_op=view_citation&citation_id=federated_security',
        description: 'Using cryptographic models to secure multi-institutional machine learning pipelines.',
        resources: [
          { file_format: 'PDF', link: 'https://res.cloudinary.com/research-connect/raw/upload/papers/federated_security.pdf' }
        ]
      }
    ],
    co_authors: [
      {
        name: 'Prof. Alex Rivera',
        author_id: 'alex_gs_id',
        link: 'https://scholar.google.com/citations?user=alex_gs_id',
        affiliations: 'CSAIL, MIT',
        thumbnail: ''
      }
    ]
  };
}
