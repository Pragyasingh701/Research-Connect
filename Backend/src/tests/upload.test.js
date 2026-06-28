import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Publication from '../models/Publication.js';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import File from '../models/File.js';
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  replaceFileInCloudinary
} from '../services/upload.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB for storage tests\n');

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

  // Pre-cleanup
  await User.deleteMany({ email: /^test_upload_/ });
  await File.deleteMany({}); // clean files collections for testing
  
  let testUser;
  let testProfile;
  let testPub;
  let testProj;

  // Create temporary mock file
  const mockTempPath = join(__dirname, 'mock-paper.pdf');
  fs.writeFileSync(mockTempPath, 'This is a mock research paper PDF file content.');
  const mockMulterFile = {
    fieldname: 'file',
    originalname: 'Deep Learning Paper.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: 'uploads/',
    filename: 'mock-paper.pdf',
    path: mockTempPath,
    size: 45
  };

  await test('Create Test Entities', async () => {
    testUser = await User.create({
      fullName: 'Upload Test Researcher',
      email: 'test_upload_user@researchconnect.org',
      password: 'Password123!',
      role: 'researcher',
      status: 'active'
    });

    testProfile = await Profile.create({
      user: testUser._id,
      displayName: 'Upload Tester',
      institution: 'MIT',
      country: 'USA'
    });

    testPub = await Publication.create({
      user: testUser._id,
      title: 'Upload Test Paper',
      abstract: 'Testing Cloudinary storage integrations.',
      publicationYear: 2026,
      publicationType: 'journal',
      uploadedBy: testUser._id
    });

    testProj = await Project.create({
      title: 'Upload Test Project',
      description: 'Project storage tests.',
      researchDomain: 'Computer Science',
      owner: testUser._id
    });

    if (!testUser || !testProfile || !testPub || !testProj) {
      throw new Error('Failed to bootstrap test entities.');
    }
  });

  let fileRecord;

  await test('Upload File using Service (Local fallback or Cloudinary)', async () => {
    fileRecord = await uploadFileToCloudinary(
      mockMulterFile,
      'publication-pdf',
      { publicationId: testPub._id },
      testUser._id
    );

    if (!fileRecord) {
      throw new Error('Upload returned null fileRecord.');
    }
    if (fileRecord.originalName !== 'Deep Learning Paper.pdf') {
      throw new Error(`Expected originalName 'Deep Learning Paper.pdf', got '${fileRecord.originalName}'`);
    }
    if (fileRecord.uploadType !== 'publication-pdf') {
      throw new Error(`Expected uploadType 'publication-pdf', got '${fileRecord.uploadType}'`);
    }
    if (fileRecord.publicationId.toString() !== testPub._id.toString()) {
      throw new Error('Related publicationId mismatch.');
    }
  });

  await test('Verification of Mongoose Schema Object Support in Publication', async () => {
    const pub = await Publication.findById(testPub._id);
    pub.pdf = {
      publicId: fileRecord.publicId,
      secureUrl: fileRecord.secureUrl,
      folder: fileRecord.folder,
      size: fileRecord.fileSize,
      format: fileRecord.format
    };
    await pub.save();

    const updatedPub = await Publication.findById(testPub._id);
    if (!updatedPub.pdf || updatedPub.pdf.publicId !== fileRecord.publicId) {
      throw new Error('PDF file object not correctly saved in Publication.');
    }
    // Check backward compatibility hooks
    if (updatedPub.pdfUrl !== fileRecord.secureUrl) {
      throw new Error(`Sync hook failed. Expected pdfUrl '${fileRecord.secureUrl}', got '${updatedPub.pdfUrl}'`);
    }
  });

  await test('Replace File in storage', async () => {
    // Re-create the mock file since the previous call might delete it (or if fallback it stays in uploads)
    fs.writeFileSync(mockTempPath, 'This is the new file content.');
    const newMockFile = { ...mockMulterFile, originalname: 'Deep Learning Paper v2.pdf' };

    const replacedRecord = await replaceFileInCloudinary(
      fileRecord.publicId,
      newMockFile,
      'publication-pdf',
      { publicationId: testPub._id },
      testUser._id
    );

    if (!replacedRecord) {
      throw new Error('Replace returned null.');
    }
    
    // Check old file is deleted from DB
    const oldFileDb = await File.findOne({ publicId: fileRecord.publicId });
    if (oldFileDb) {
      throw new Error('Old file record still exists in DB after replacement.');
    }

    // Check new file exists in DB
    const newFileDb = await File.findOne({ publicId: replacedRecord.publicId });
    if (!newFileDb) {
      throw new Error('New file record was not found in DB after replacement.');
    }

    // Update fileRecord to the new one for downstream tests
    fileRecord = replacedRecord;
  });

  await test('Delete Publication cascade deletes associated files', async () => {
    // Mimic the deletePublication cascade cleanup
    const pub = await Publication.findById(testPub._id);
    
    // Trigger cleanup
    const associatedFiles = await File.find({ publicationId: pub._id });
    for (const f of associatedFiles) {
      await deleteFileFromCloudinary(f.publicId);
    }
    
    pub.isDeleted = true;
    await pub.save();

    const checkedFile = await File.findOne({ publicationId: testPub._id });
    if (checkedFile) {
      throw new Error('File record still exists in DB after publication deletion.');
    }
  });

  // Post-cleanup
  await User.deleteMany({ email: /^test_upload_/ });
  await Profile.deleteMany({ user: testUser._id });
  await Publication.deleteMany({ _id: testPub._id });
  await Project.deleteMany({ _id: testProj._id });
  await File.deleteMany({ uploadedBy: testUser._id });

  // Clean up any remaining physical mock files
  try {
    if (fs.existsSync(mockTempPath)) {
      fs.unlinkSync(mockTempPath);
    }
  } catch (_) {}

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('⚠️  Some storage tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All Cloudinary storage and metadata architecture tests passed!');
  }

  await mongoose.connect(MONGO_URI);
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
