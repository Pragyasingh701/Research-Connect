import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/researchconnect';

// Import models
import User from '../models/User.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectTask from '../models/ProjectTask.js';
import ProjectAnalytics from '../models/ProjectAnalytics.js';

// Import controller functions to test
import {
  createProject,
  getProjectDetails,
  createTask,
  changeTaskStatus,
} from '../controllers/project.controller.js';

async function runTests() {
  console.log('⚡ Connecting to database for Project System Integration Tests...\n');
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

  // Set up test data
  const testEmail = 'test_project_owner@researchconnect.org';
  await User.deleteMany({ email: testEmail });
  
  let testUser;
  let testProject;
  let testTask;

  await test('Create Test User', async () => {
    testUser = await User.create({
      fullName: 'Dr. Project Tester',
      email: testEmail,
      password: 'Password123!',
      role: 'researcher',
      status: 'active',
    });
    if (!testUser) throw new Error('User creation failed');
  });

  await test('Create Project Workspace', async () => {
    // Mock Request & Response
    const req = {
      user: testUser,
      body: {
        title: `Test AI Research Project ${Date.now()}`,
        shortTitle: 'AI Test',
        description: 'Testing the Project controllers and models compilation.',
        researchDomain: 'Computer Science',
        researchArea: 'Artificial Intelligence',
        keywords: ['AI', 'Testing', 'MERN'],
        objectives: ['Deploy successfully', 'Run integration tests'],
        type: 'Individual',
        status: 'Draft',
        visibility: 'Public',
      },
    };

    let responseData = null;
    const res = {
      status(code) {
        return {
          json(data) {
            responseData = data;
          },
        };
      },
    };

    const next = (err) => {
      if (err) throw err;
    };

    await createProject(req, res, next);

    if (!responseData || responseData.status !== 'success') {
      throw new Error('Project creation API failed: ' + JSON.stringify(responseData));
    }

    testProject = responseData.data;

    // Check ProjectMember and ProjectAnalytics
    const member = await ProjectMember.findOne({ project: testProject._id, user: testUser._id });
    if (!member || member.permission !== 'Owner') {
      throw new Error('Owner ProjectMember not created or incorrect permission');
    }

    const analytics = await ProjectAnalytics.findOne({ project: testProject._id });
    if (!analytics) {
      throw new Error('ProjectAnalytics record not initialized');
    }
  });

  await test('Get Project Detail Page API', async () => {
    const req = {
      user: testUser,
      params: { id: testProject._id },
    };

    let responseData = null;
    const res = {
      status(code) {
        return {
          json(data) {
            responseData = data;
          },
        };
      },
    };

    await getProjectDetails(req, res, (err) => { if (err) throw err; });

    if (!responseData || responseData.status !== 'success') {
      throw new Error('Get project details API failed');
    }
    
    const details = responseData.data;
    if (details.members.length !== 1 || !details.analytics) {
      throw new Error('Get details returned incomplete fields');
    }
  });

  await test('Create Project Task API', async () => {
    const req = {
      user: testUser,
      params: { id: testProject._id },
      body: {
        title: 'Complete Phase 8 Integration Test',
        description: 'Test all endpoints including tasks, files, etc.',
        priority: 'High',
        assignee: testUser._id,
        deadline: new Date(Date.now() + 86400000),
      },
    };

    let responseData = null;
    const res = {
      status(code) {
        return {
          json(data) {
            responseData = data;
          },
        };
      },
    };

    await createTask(req, res, (err) => { if (err) throw err; });

    if (!responseData || responseData.status !== 'success') {
      throw new Error('Task creation API failed');
    }

    testTask = responseData.data;

    const analytics = await ProjectAnalytics.findOne({ project: testProject._id });
    if (!analytics || analytics.pendingTasks !== 1) {
      throw new Error('Analytics failed to recalculate on task creation');
    }
  });

  await test('Complete Project Task API', async () => {
    const req = {
      user: testUser,
      params: { id: testProject._id, taskId: testTask._id },
      body: {
        status: 'Completed',
      },
    };

    let responseData = null;
    const res = {
      status(code) {
        return {
          json(data) {
            responseData = data;
          },
        };
      },
    };

    await changeTaskStatus(req, res, (err) => { if (err) throw err; });

    if (!responseData || responseData.status !== 'success') {
      throw new Error('Task status update API failed');
    }

    const analytics = await ProjectAnalytics.findOne({ project: testProject._id });
    if (!analytics || analytics.progress !== 100 || analytics.completedTasks !== 1) {
      throw new Error('Analytics failed to recalculate on task completion');
    }
  });

  // Clean up
  await User.deleteMany({ email: testEmail });
  if (testProject) {
    await Project.findByIdAndDelete(testProject._id);
    await ProjectMember.deleteMany({ project: testProject._id });
    await ProjectTask.deleteMany({ project: testProject._id });
    await ProjectAnalytics.deleteMany({ project: testProject._id });
  }

  console.log('\n======================================');
  console.log(`📊 TEST RUN COMPLETED`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log('======================================');

  await mongoose.disconnect();
  process.exit(results.failed === 0 ? 0 : 1);
}

runTests();
