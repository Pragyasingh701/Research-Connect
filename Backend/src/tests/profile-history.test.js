import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ProfileHistory from '../models/ProfileHistory.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

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

  // Clean up
  await User.deleteMany({ email: /^test_history_/ });
  
  let testUser;
  let testProfile;

  await test('Create Test User & Profile', async () => {
    testUser = await User.create({
      fullName: 'History Test User',
      email: 'test_history_user@researchconnect.org',
      password: 'Password123!',
      role: 'researcher'
    });

    testProfile = await Profile.create({
      user: testUser._id,
      displayName: 'Sarah Version 1',
      headline: 'V1 Headline',
      bio: 'V1 Bio',
      institution: 'Stanford',
      country: 'USA'
    });

    if (!testUser._id || !testProfile._id) {
      throw new Error('User/Profile was not created properly.');
    }
  });

  await test('Record Profile History Snapshots', async () => {
    // Version 1 snapshot
    await ProfileHistory.create({
      user: testUser._id,
      version: 1,
      changeSummary: 'Initial profile creation',
      snapshot: testProfile.toObject(),
      changedBy: testUser._id
    });

    // Update to Version 2
    testProfile.displayName = 'Sarah Version 2';
    testProfile.headline = 'V2 Headline';
    await testProfile.save();

    await ProfileHistory.create({
      user: testUser._id,
      version: 2,
      changeSummary: 'Updated headline and name',
      snapshot: testProfile.toObject(),
      changedBy: testUser._id
    });

    const count = await ProfileHistory.countDocuments({ user: testUser._id });
    if (count !== 2) throw new Error(`Expected 2 snapshots, found ${count}`);
  });

  await test('Rollback to Version 1', async () => {
    const version1History = await ProfileHistory.findOne({ user: testUser._id, version: 1 });
    if (!version1History) throw new Error('Version 1 snapshot not found.');

    const snapshot = version1History.snapshot;
    const rolledBackProfile = await Profile.findOneAndUpdate(
      { user: testUser._id },
      {
        displayName: snapshot.displayName,
        headline: snapshot.headline,
        bio: snapshot.bio,
        institution: snapshot.institution,
        country: snapshot.country
      },
      { new: true }
    );

    if (rolledBackProfile.displayName !== 'Sarah Version 1') {
      throw new Error(`Expected displayName 'Sarah Version 1', got '${rolledBackProfile.displayName}'`);
    }
    if (rolledBackProfile.headline !== 'V1 Headline') {
      throw new Error(`Expected headline 'V1 Headline', got '${rolledBackProfile.headline}'`);
    }
  });

  // Cleanup
  await User.deleteMany({ email: /^test_history_/ });
  await Profile.deleteMany({ user: testUser._id });
  await ProfileHistory.deleteMany({ user: testUser._id });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All profile history and rollback tests passed!');
  }

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
