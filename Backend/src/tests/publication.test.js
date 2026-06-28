import Publication from '../models/Publication.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
      console.error(`   ${err.message}`);
      results.failed++;
    }
  }

  // Clean up before tests
  await Publication.deleteMany({ title: /^TEST_PUB_/ });

  let createdId;

  // 1. Create
  await test('Create a publication', async () => {
    const pub = await Publication.create({
      title: 'TEST_PUB_Alpha - Deep Learning Survey',
      abstract: 'A comprehensive survey of deep learning techniques.',
      authors: [{ displayName: 'Harsh Sharma', institution: 'IIT Delhi' }],
      journal: 'IEEE Transactions',
      publicationDate: new Date('2024-03-15'),
      tags: ['deep learning', 'ai', 'neural networks'],
      citationCount: 5,
    });
    createdId = pub._id;
    if (!pub._id) throw new Error('Publication was not created');
    if (pub.title !== 'TEST_PUB_Alpha - Deep Learning Survey') throw new Error('Title mismatch');
  });

  // 2. Read by ID
  await test('Fetch publication by ID', async () => {
    const pub = await Publication.findById(createdId).lean();
    if (!pub) throw new Error('Publication not found by ID');
    if (pub.citationCount !== 5) throw new Error('citationCount mismatch');
  });

  // 3. Update
  await test('Update publication', async () => {
    const updated = await Publication.findByIdAndUpdate(
      createdId,
      { $set: { citationCount: 10, journal: 'Nature' } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new Error('Update returned null');
    if (updated.citationCount !== 10) throw new Error('citationCount not updated');
    if (updated.journal !== 'Nature') throw new Error('journal not updated');
  });

  // 4. Increment citation
  await test('Increment citation count', async () => {
    const updated = await Publication.findByIdAndUpdate(
      createdId,
      { $inc: { citationCount: 1 } },
      { new: true }
    ).lean();
    if (updated.citationCount !== 11) throw new Error(`Expected 11, got ${updated.citationCount}`);
  });

  // 5. Pagination & sorting
  await test('Pagination and sorting', async () => {
    await Publication.create([
      {
        title: 'TEST_PUB_Beta - NLP Advances',
        abstract: 'Natural language processing advances.',
        authors: [{ displayName: 'Mohd Irshad' }],
        publicationDate: new Date('2023-05-01'),
        citationCount: 50,
        tags: ['nlp'],
      },
      {
        title: 'TEST_PUB_Gamma - Computer Vision',
        abstract: 'Modern computer vision techniques.',
        authors: [{ displayName: 'Ravi Kumar' }],
        publicationDate: new Date('2022-01-20'),
        citationCount: 100,
        tags: ['computer vision', 'ai'],
      },
    ]);

    const page = 1, limit = 2, skip = 0;
    const pubs = await Publication.find({ title: /^TEST_PUB_/ })
      .sort({ citationCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    if (pubs.length !== 2) throw new Error(`Expected 2 results, got ${pubs.length}`);
    if (pubs[0].citationCount < pubs[1].citationCount) throw new Error('Sort order wrong (desc)');
  });

  // 6. Filter by tag
  await test('Filter by tag', async () => {
    const pubs = await Publication.find({ tags: { $in: ['ai'] }, title: /^TEST_PUB_/ }).lean();
    if (pubs.length < 2) throw new Error(`Expected at least 2 publications tagged 'ai', got ${pubs.length}`);
  });

  // 7. Filter by year
  await test('Filter by year', async () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31T23:59:59.999Z');
    const pubs = await Publication.find({
      publicationDate: { $gte: start, $lte: end },
      title: /^TEST_PUB_/,
    }).lean();
    if (pubs.length !== 1) throw new Error(`Expected 1, got ${pubs.length}`);
  });

  // 8. Search by author name
  await test('Search by author displayName', async () => {
    const pubs = await Publication.find({
      'authors.displayName': { $regex: 'Harsh', $options: 'i' },
      title: /^TEST_PUB_/,
    }).lean();
    if (pubs.length < 1) throw new Error('Author search returned no results');
  });

  // 9. Full-text-style search (regex)
  await test('Keyword search in title/abstract', async () => {
    const q = 'learning';
    const pubs = await Publication.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { abstract: { $regex: q, $options: 'i' } },
      ],
      title: /^TEST_PUB_/,
    }).lean();
    if (pubs.length < 1) throw new Error('Keyword search returned no results');
  });

  // 10. Duplicate title should fail (unique constraint)
  await test('Reject duplicate title', async () => {
    try {
      await Publication.create({
        title: 'TEST_PUB_Alpha - Deep Learning Survey',
        abstract: 'Duplicate abstract.',
        authors: [{ displayName: 'Someone' }],
      });
      throw new Error('Should have thrown a duplicate key error');
    } catch (err) {
      if (!err.code || err.code !== 11000) throw err;
    }
  });

  // 11. Delete
  await test('Delete publication', async () => {
    const deleted = await Publication.findByIdAndDelete(createdId);
    if (!deleted) throw new Error('Delete returned null');
    const check = await Publication.findById(createdId);
    if (check) throw new Error('Publication still exists after delete');
  });

  // Cleanup
  await Publication.deleteMany({ title: /^TEST_PUB_/ });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed. Fix before pushing.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! Ready to push.');
  }

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
