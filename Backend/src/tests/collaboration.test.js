import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load models
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Follow from '../models/Follow.js';
import ResearcherConnection from '../models/ResearcherConnection.js';
import CollaborationStatus from '../models/CollaborationStatus.js';
import CollaborationPreference from '../models/CollaborationPreference.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Collaboration from '../models/Collaboration.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB for Collaboration & Network Tests\n');

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

  // Initial Clean up
  const testEmailA = 'test_network_a@researchconnect.org';
  const testEmailB = 'test_network_b@researchconnect.org';
  await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });

  let userA, userB;
  let profileA, profileB;

  await test('Create Test Users & Profiles', async () => {
    userA = await User.create({
      fullName: 'Researcher Alice',
      email: testEmailA,
      password: 'Password123!',
      role: 'researcher'
    });

    profileA = await Profile.create({
      user: userA._id,
      displayName: 'Alice Academic',
      institution: 'Stanford University',
      designation: 'Professor',
      country: 'USA'
    });

    userB = await User.create({
      fullName: 'Researcher Bob',
      email: testEmailB,
      password: 'Password123!',
      role: 'researcher'
    });

    profileB = await Profile.create({
      user: userB._id,
      displayName: 'Bob Scholar',
      institution: 'MIT',
      designation: 'Assistant Professor',
      country: 'USA'
    });

    if (!userA || !userB || !profileA || !profileB) {
      throw new Error('Failed to bootstrap test users/profiles.');
    }
  });

  await test('Follower & Following Flow', async () => {
    // Alice follows Bob
    const followRecord = await Follow.create({
      followerId: userA._id,
      followingId: userB._id
    });

    if (!followRecord) throw new Error('Failed to create follow record');

    // Check counts
    const followersOfBob = await Follow.countDocuments({ followingId: userB._id });
    const followingByAlice = await Follow.countDocuments({ followerId: userA._id });

    if (followersOfBob !== 1) throw new Error(`Expected Bob to have 1 follower, got ${followersOfBob}`);
    if (followingByAlice !== 1) throw new Error(`Expected Alice to follow 1 user, got ${followingByAlice}`);

    // Alice unfollows Bob
    await Follow.deleteOne({ followerId: userA._id, followingId: userB._id });
    const followersAfterUnfollow = await Follow.countDocuments({ followingId: userB._id });
    if (followersAfterUnfollow !== 0) throw new Error('Unfollow did not decrement count');
  });

  let connectionRecord;

  await test('Connection Requests Flow (LinkedIn style)', async () => {
    // Alice sends connection request to Bob
    connectionRecord = await ResearcherConnection.create({
      requester: userA._id,
      receiver: userB._id,
      status: 'Pending'
    });

    if (!connectionRecord) throw new Error('Failed to create connection request');

    // Verify status is pending
    const checkPending = await ResearcherConnection.findOne({
      requester: userA._id,
      receiver: userB._id
    });
    if (checkPending.status !== 'Pending') throw new Error('Connection status is not Pending');

    // Bob accepts connection request
    connectionRecord.status = 'Connected';
    connectionRecord.connectedAt = new Date();
    await connectionRecord.save();

    // Verify connected status
    const checkConnected = await ResearcherConnection.findOne({ _id: connectionRecord._id });
    if (checkConnected.status !== 'Connected') throw new Error('Connection status is not Connected');
  });

  await test('Collaboration Availability Status & Preferences', async () => {
    // Set Alice's status
    const statusRecord = await CollaborationStatus.create({
      user: userA._id,
      status: 'Open for Collaboration',
      availabilityNote: 'Interested in Deep Learning and NLP projects.',
      visibility: 'Public'
    });

    if (!statusRecord || statusRecord.status !== 'Open for Collaboration') {
      throw new Error('Failed to create collaboration status record');
    }

    // Set Alice's preferences
    const preferenceRecord = await CollaborationPreference.create({
      user: userA._id,
      collaborationMode: 'Remote',
      weeklyAvailabilityHours: 10,
      maxActiveCollaborations: 3,
      preferredLanguages: ['English', 'Spanish'],
      allowedInstitutions: [],
      projectTypePreferences: ['Joint Research', 'Paper Writing']
    });

    if (!preferenceRecord || preferenceRecord.collaborationMode !== 'Remote') {
      throw new Error('Failed to create collaboration preference record');
    }
  });

  let collabRequest;

  await test('Collaboration Proposal Request Flow', async () => {
    // Alice invites Bob to collaborate
    collabRequest = await CollaborationRequest.create({
      sender: userA._id,
      receiver: userB._id,
      projectTitle: 'Robust NLP Frameworks',
      researchArea: 'Natural Language Processing',
      purpose: 'To build robust cross-lingual NLP parsers.',
      expectedContribution: 'Bob will handle semantic parsing, Alice will handle model training.',
      requiredSkills: ['NLP', 'Transformers', 'PyTorch'],
      timeline: '6 Months',
      fundingAvailable: true,
      message: 'Hi Bob, I noticed your work on semantic parsers. Let\'s collaborate!',
      status: 'Pending'
    });

    if (!collabRequest || collabRequest.projectTitle !== 'Robust NLP Frameworks') {
      throw new Error('Failed to create collaboration request');
    }
  });

  await test('Accept Collaboration & Provision Workspace', async () => {
    // Bob accepts the collaboration request
    collabRequest.status = 'Accepted';
    await collabRequest.save();

    // Create the active collaboration workspace
    const workspace = await Collaboration.create({
      request: collabRequest._id,
      title: collabRequest.projectTitle,
      researchArea: collabRequest.researchArea,
      creator: collabRequest.sender,
      members: [
        { user: collabRequest.sender, role: 'PI' },
        { user: collabRequest.receiver, role: 'Co-Investigator' }
      ],
      progress: 0,
      status: 'Active'
    });

    if (!workspace || workspace.status !== 'Active') {
      throw new Error('Failed to provision collaboration workspace');
    }

    const checkWorkspace = await Collaboration.findOne({ _id: workspace._id });
    if (checkWorkspace.members.length !== 2) {
      throw new Error('Workspace member count mismatch');
    }
  });

  // Tear down
  await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });
  await Profile.deleteMany({ user: { $in: [userA._id, userB._id] } });
  await Follow.deleteMany({ $or: [{ followerId: userA._id }, { followingId: userB._id }] });
  await ResearcherConnection.deleteMany({ $or: [{ requester: userA._id }, { receiver: userA._id }] });
  await CollaborationStatus.deleteMany({ user: { $in: [userA._id, userB._id] } });
  await CollaborationPreference.deleteMany({ user: { $in: [userA._id, userB._id] } });
  if (collabRequest) {
    await CollaborationRequest.deleteMany({ _id: collabRequest._id });
    await Collaboration.deleteMany({ request: collabRequest._id });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All Phase 7 collaboration and network tests passed!');
  }

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
