import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load models
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Follow from '../models/Follow.js';
import BlockedUser from '../models/BlockedUser.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import * as followService from '../services/follow.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function runTests() {
  console.log('⚡ Connecting to database for Follow System Integration Tests...\n');
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

  // Clear test users
  const emailA = 'test_follow_a@researchconnect.org';
  const emailB = 'test_follow_b@researchconnect.org';
  const emailC = 'test_follow_c@researchconnect.org'; // non-researcher role

  await User.deleteMany({ email: { $in: [emailA, emailB, emailC] } });

  let userA, userB, userC;
  let profileA, profileB, profileC;

  await test('Create Test Users & Profiles', async () => {
    userA = await User.create({
      fullName: 'Dr. Alice Jenkins',
      email: emailA,
      password: 'Password123!',
      role: 'researcher',
    });

    profileA = await Profile.create({
      user: userA._id,
      institution: 'Stanford University',
      designation: 'Professor',
      country: 'USA',
    });

    userB = await User.create({
      fullName: 'Bob Scholar',
      email: emailB,
      password: 'Password123!',
      role: 'researcher',
    });

    profileB = await Profile.create({
      user: userB._id,
      institution: 'MIT',
      designation: 'Postdoc',
      country: 'USA',
    });

    userC = await User.create({
      fullName: 'Charlie Sponsor',
      email: emailC,
      password: 'Password123!',
      role: 'sponsor',
    });

    profileC = await Profile.create({
      user: userC._id,
      institution: 'Global Tech Corp',
      designation: 'Funding Manager',
      country: 'Canada',
    });

    if (!userA || !userB || !userC) {
      throw new Error('Failed to bootstrap test users');
    }
  });

  await test('Business Rule: Cannot follow oneself', async () => {
    try {
      await followService.followUser(userA._id, userA._id);
      throw new Error('Should have failed to follow oneself');
    } catch (err) {
      if (err.message !== 'You cannot follow yourself') {
        throw err;
      }
    }
  });

  await test('Business Rule: Cannot follow duplicate users', async () => {
    // Perform first follow
    const { follow } = await followService.followUser(userA._id, userB._id);
    if (!follow) throw new Error('Failed to follow');

    // Try second follow
    try {
      await followService.followUser(userA._id, userB._id);
      throw new Error('Should have failed duplicate follow');
    } catch (err) {
      if (!err.message.includes('already following')) {
        throw err;
      }
    }

    // Clean up follow record
    await followService.unfollowUser(userA._id, userB._id);
  });

  await test('Business Rule: Blocked users cannot follow each other', async () => {
    // Bob blocks Alice
    await BlockedUser.create({ blocker: userB._id, blocked: userA._id });

    try {
      await followService.followUser(userA._id, userB._id);
      throw new Error('Alice should have been blocked from following Bob');
    } catch (err) {
      if (!err.message.includes('blocked')) {
        throw err;
      }
    }

    try {
      await followService.followUser(userB._id, userA._id);
      throw new Error('Bob should have been blocked from following Alice');
    } catch (err) {
      if (!err.message.includes('blocked')) {
        throw err;
      }
    }

    // Clean up block
    await BlockedUser.deleteOne({ blocker: userB._id, blocked: userA._id });
  });

  await test('Business Rule: Role-based follow restriction', async () => {
    // Bob changes follow restriction to 'researchers'
    profileB.privacySettings.allowFollowFrom = 'researchers';
    await profileB.save();

    // Alice (researcher) follows Bob -> should succeed
    const { follow } = await followService.followUser(userA._id, userB._id);
    if (!follow) throw new Error('Alice failed to follow Bob');

    // Charlie (sponsor) follows Bob -> should fail
    try {
      await followService.followUser(userC._id, userB._id);
      throw new Error('Charlie should have been blocked from following Bob');
    } catch (err) {
      if (!err.message.includes('Only researchers can follow')) {
        throw err;
      }
    }

    // Clean up follow and restore settings
    await followService.unfollowUser(userA._id, userB._id);
    profileB.privacySettings.allowFollowFrom = 'anyone';
    await profileB.save();
  });

  await test('Verify followerCount and followingCount increments and decrements', async () => {
    // Check initial counts
    let uA = await User.findById(userA._id);
    let uB = await User.findById(userB._id);
    if (uA.followingCount !== 0 || uB.followersCount !== 0) {
      throw new Error('Initial counts are not zero');
    }

    // Alice follows Bob
    await followService.followUser(userA._id, userB._id);

    uA = await User.findById(userA._id);
    uB = await User.findById(userB._id);
    if (uA.followingCount !== 1) throw new Error(`Expected Alice followingCount to be 1, got ${uA.followingCount}`);
    if (uB.followersCount !== 1) throw new Error(`Expected Bob followersCount to be 1, got ${uB.followersCount}`);

    // Alice unfollows Bob
    await followService.unfollowUser(userA._id, userB._id);

    uA = await User.findById(userA._id);
    uB = await User.findById(userB._id);
    if (uA.followingCount !== 0) throw new Error(`Expected Alice followingCount to be 0, got ${uA.followingCount}`);
    if (uB.followersCount !== 0) throw new Error(`Expected Bob followersCount to be 0, got ${uB.followersCount}`);
  });

  await test('Verify Notification and Activity feed creation', async () => {
    // Alice follows Bob
    const { follow } = await followService.followUser(userA._id, userB._id);

    // Verify Notification
    const notif = await Notification.findOne({
      user: userB._id,
      sender: userA._id,
      type: 'Follow',
      relatedEntity: follow._id,
    });
    if (!notif) throw new Error('Follow notification not created');
    if (!notif.message.includes('Dr. Alice Jenkins started following you')) {
      throw new Error(`Notification message incorrect: ${notif.message}`);
    }

    // Verify Activity
    const act = await Activity.findOne({
      user: userA._id,
      type: 'follow',
      targetUser: userB._id,
    });
    if (!act) throw new Error('Follow activity log not created');
    if (!act.activityText.includes('Dr. Alice Jenkins started following Bob Scholar')) {
      throw new Error(`Activity log text incorrect: ${act.activityText}`);
    }

    // Clean up follow
    await followService.unfollowUser(userA._id, userB._id);
  });

  await test('Verify Analytics calculations', async () => {
    // Alice and Charlie follow Bob
    await followService.followUser(userA._id, userB._id);
    await followService.followUser(userC._id, userB._id);

    const analytics = await followService.getFollowAnalytics(userB._id);
    
    if (analytics.totalFollowers !== 2) {
      throw new Error(`Expected totalFollowers to be 2, got ${analytics.totalFollowers}`);
    }
    if (analytics.newFollowersToday !== 2) {
      throw new Error(`Expected newFollowersToday to be 2, got ${analytics.newFollowersToday}`);
    }
    if (analytics.topCountries.length === 0 || analytics.topCountries[0].name !== 'USA') {
      throw new Error('Analytics top countries incorrect');
    }

    // Clean up
    await followService.unfollowUser(userA._id, userB._id);
    await followService.unfollowUser(userC._id, userB._id);
  });

  // Final Clean up
  await User.deleteMany({ email: { $in: [emailA, emailB, emailC] } });
  await Profile.deleteMany({ user: { $in: [userA._id, userB._id, userC._id] } });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  await mongoose.disconnect();
  process.exit(results.failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal error running follow tests:', err);
  process.exit(1);
});
