import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Import models
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import AcademicProfile from '../models/AcademicProfile.js';
import ResearchMetrics from '../models/ResearchMetrics.js';
import Publication from '../models/Publication.js';
import ExternalAccount from '../models/ExternalAccount.js';

// Import services & helper
import { scholarService } from '../services/scholar.service.js';
import { updateFieldWithMetadata } from '../utils/sourceTracker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

// Mock Axios Google Scholar response
const mockSerpApiResponse = {
  data: {
    author: {
      name: 'Dr. Scholar Mock',
      affiliations: 'Amity University, India',
      email: 'verified_email@amity.edu',
      website: 'https://mockscholar.org',
      interests: [
        { title: 'Machine Learning' },
        { title: 'Artificial Intelligence' }
      ],
      thumbnail: 'https://mockscholar.org/photo.jpg'
    },
    cited_by: {
      table: [
        { citations: { all: 1250 } },
        { h_index: { all: 18 } },
        { i10_index: { all: 24 } }
      ],
      graph: [
        { year: 2023, citations: 150 },
        { year: 2024, citations: 280 },
        { year: 2025, citations: 320 },
        { year: 2026, citations: 500 }
      ]
    },
    publications: [
      {
        title: 'Deep Learning in Health Informatics',
        link: 'https://mockscholar.org/pub1',
        citation_id: 'mock_author_id:pub1',
        authors: 'S Kushwaha, J Doe',
        publication: 'Journal of Biomedical Informatics, 2026',
        num_citations: {
          count: 45
        }
      },
      {
        title: 'A Survey of Large Language Models',
        link: 'https://mockscholar.org/pub2',
        citation_id: 'mock_author_id:pub2',
        authors: 'S Kushwaha, A Smith',
        publication: 'IEEE Transactions on AI, 2025',
        num_citations: {
          count: 120
        }
      }
    ],
    co_authors: [
      {
        name: 'John Doe',
        email: 'john.doe@mock.edu',
        author_id: 'john_doe_id'
      }
    ]
  }
};

// Override axios.get to return mock response
axios.get = async (url) => {
  return mockSerpApiResponse;
};

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB for Google Scholar Sync Tests\n');

  const results = { passed: 0, failed: 0 };

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.stack || err.message}`);
      results.failed++;
    }
  }

  // Cleanup pre-existing test data
  const testEmail = 'scholar_sync_test@researchconnect.org';
  await User.deleteMany({ email: testEmail });
  
  let testUser;
  let testProfile;
  let testAcademic;

  await test('Create Test User, Profile, and Academic Profile', async () => {
    testUser = await User.create({
      fullName: 'Scholar Test User',
      email: testEmail,
      password: 'Password123!',
      role: 'researcher'
    });

    testProfile = await Profile.create({
      user: testUser._id,
      displayName: 'Original Unsynced Name',
      headline: 'Unsynced Headline',
      institution: 'Original Institution',
      bio: 'Original Bio'
    });

    testAcademic = await AcademicProfile.create({
      user: testUser._id,
      googleScholar: 'mock_author_id'
    });

    if (!testUser._id || !testProfile._id || !testAcademic._id) {
      throw new Error('Initial test documents failed to create.');
    }
  });

  await test('Initial importGoogleScholarProfile fills data', async () => {
    const importResult = await scholarService.importGoogleScholarProfile(
      testUser._id,
      'mock_author_id'
    );

    // Verify profile update
    const updatedProfile = await Profile.findOne({ user: testUser._id });
    if (updatedProfile.displayName !== 'Dr. Scholar Mock') {
      throw new Error(`Expected displayName to be 'Dr. Scholar Mock', got '${updatedProfile.displayName}'`);
    }
    if (updatedProfile.institution !== 'Amity University') {
      throw new Error(`Expected institution to be 'Amity University', got '${updatedProfile.institution}'`);
    }

    // Verify metadata sources
    const nameMeta = updatedProfile.fieldMetadata.get('displayName');
    if (!nameMeta || nameMeta.source !== 'googleScholar') {
      throw new Error(`Expected displayName metadata source to be 'googleScholar', got '${nameMeta?.source}'`);
    }

    // Verify publications imported
    const pubsCount = await Publication.countDocuments({ user: testUser._id });
    if (pubsCount !== 2) {
      throw new Error(`Expected 2 publications to be imported, found ${pubsCount}`);
    }

    // Verify metrics imported
    const metrics = await ResearchMetrics.findOne({ user: testUser._id });
    if (!metrics || metrics.totalCitations !== 1250) {
      throw new Error(`Expected 1250 total citations, found ${metrics?.totalCitations}`);
    }
    if (metrics.citationsByYear.length !== 4) {
      throw new Error(`Expected 4 citation history entries, found ${metrics?.citationsByYear?.length}`);
    }
  });

  await test('Manual PATCH overrides lock and sets source to manual', async () => {
    const profile = await Profile.findOne({ user: testUser._id });
    updateFieldWithMetadata(profile, 'displayName', 'Manually Overridden Name', 'manual', testUser._id);
    await profile.save();

    const updatedProfile = await Profile.findOne({ user: testUser._id });
    if (updatedProfile.displayName !== 'Manually Overridden Name') {
      throw new Error(`Expected updated displayName to be 'Manually Overridden Name', got '${updatedProfile.displayName}'`);
    }

    const nameMeta = updatedProfile.fieldMetadata.get('displayName');
    if (!nameMeta || nameMeta.source !== 'manual') {
      throw new Error(`Expected metadata source to be 'manual', got '${nameMeta?.source}'`);
    }
  });

  await test('Subsequent sync does NOT overwrite manually locked fields', async () => {
    // Modify mock data to simulate change on Google Scholar
    mockSerpApiResponse.data.author.name = 'Brand New Scholar Name';
    mockSerpApiResponse.data.author.affiliations = 'Amity University Updated';

    // Run sync again
    await scholarService.importGoogleScholarProfile(testUser._id, 'mock_author_id');

    const syncedProfile = await Profile.findOne({ user: testUser._id });
    
    // Confirms 'displayName' was NOT overwritten because it is locked by 'manual' source
    if (syncedProfile.displayName !== 'Manually Overridden Name') {
      throw new Error(`Override lock FAILED. displayName was overwritten to '${syncedProfile.displayName}'`);
    }

    // Confirms non-locked field 'institution' WAS updated
    if (syncedProfile.institution !== 'Amity University Updated') {
      throw new Error(`Expected institution to be updated to 'Amity University Updated', got '${syncedProfile.institution}'`);
    }
  });

  await test('Selective Merge Sync only imports specified fields & publications', async () => {
    // Reset DB state for user's publications and website
    await Publication.deleteMany({ user: testUser._id });
    const profile = await Profile.findOne({ user: testUser._id });
    updateFieldWithMetadata(profile, 'website', '', 'manual', testUser._id);
    await profile.save();

    // Set new mock website
    mockSerpApiResponse.data.author.website = 'https://selective-website.org';

    // Selective sync: only import 'website' and publication 'Deep Learning in Health Informatics'
    await scholarService.importGoogleScholarProfile(
      testUser._id,
      'mock_author_id',
      ['Deep Learning in Health Informatics'], // Selected Publications
      ['website'] // Selected Fields
    );

    const mergedProfile = await Profile.findOne({ user: testUser._id });
    if (mergedProfile.website !== 'https://selective-website.org') {
      throw new Error(`Selective field sync FAILED. Website is '${mergedProfile.website}'`);
    }

    const pubCount = await Publication.countDocuments({ user: testUser._id });
    if (pubCount !== 1) {
      throw new Error(`Selective publication sync FAILED. Expected 1 publication, found ${pubCount}`);
    }

    const importedPub = await Publication.findOne({ user: testUser._id });
    if (importedPub.title !== 'Deep Learning in Health Informatics') {
      throw new Error(`Expected imported publication title 'Deep Learning in Health Informatics', got '${importedPub.title}'`);
    }
  });

  // Final Cleanup
  await User.deleteMany({ email: testEmail });
  await Profile.deleteMany({ user: testUser._id });
  await AcademicProfile.deleteMany({ user: testUser._id });
  await ResearchMetrics.deleteMany({ user: testUser._id });
  await Publication.deleteMany({ user: testUser._id });
  await ExternalAccount.deleteMany({ user: testUser._id });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('⚠️  Some integration tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All Google Scholar profile synchronization and manual-lock tests passed successfully!');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in integration tests:', err);
  process.exit(1);
});
