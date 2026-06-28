import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import AcademicProfile from '../models/AcademicProfile.js';
import ResearchArea from '../models/ResearchArea.js';
import UserResearchArea from '../models/UserResearchArea.js';
import Keyword from '../models/Keyword.js';
import UserKeyword from '../models/UserKeyword.js';
import Publication from '../models/Publication.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationKeyword from '../models/PublicationKeyword.js';
import PublicationResearchArea from '../models/PublicationResearchArea.js';
import CollaborationPreference from '../models/CollaborationPreference.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Recommendation from '../models/Recommendation.js';
import Notification from '../models/Notification.js';
import SavedPublication from '../models/SavedPublication.js';
import Follow from '../models/Follow.js';
import SearchHistory from '../models/SearchHistory.js';
import ActivityLog from '../models/ActivityLog.js';
import Report from '../models/Report.js';
import ResearchFeed from '../models/ResearchFeed.js';
import OTP from '../models/OTP.js';
import ResearchDomain from '../models/ResearchDomain.js';
import ResearchTaxonomy from '../models/ResearchTaxonomy.js';
import Institution from '../models/Institution.js';
import ResearchInterest from '../models/ResearchInterest.js';
import KeywordSynonym from '../models/KeywordSynonym.js';
import { seedPublicationTypes, seedLicenses } from './seeder.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/research_connect';

const seedDatabase = async () => {
  try {
    console.log('📡 Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connection established.');

    console.log('🧹 Clearing existing database collections...');
    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      await mongoose.connection.collections[name].deleteMany({});
      console.log(`   - Cleared collection: ${name}`);
    }
    console.log('✅ Database cleared.');

    // Seed dynamic types and licenses
    await seedPublicationTypes();
    await seedLicenses();

    // 1. Seed Research Areas
    console.log('🌱 Seeding Research Areas...');
    const researchAreasData = [
      { areaName: 'Artificial Intelligence', description: 'Systems that mimic human intelligence to perform tasks.' },
      { areaName: 'Machine Learning', description: 'Algorithms that improve automatically through experience.' },
      { areaName: 'Deep Learning', description: 'Neural networks with representation learning.' },
      { areaName: 'Natural Language Processing', description: 'Interaction between computers and human languages.' },
      { areaName: 'Computer Vision', description: 'How computers gain high-level understanding from digital images.' },
      { areaName: 'Cyber Security', description: 'Protection of computer systems and networks.' },
      { areaName: 'Data Science', description: 'Extracting knowledge and insights from structured and unstructured data.' },
      { areaName: 'Blockchain', description: 'Decentralized ledger systems and smart contracts.' },
      { areaName: 'Healthcare AI', description: 'AI applications in diagnostics, therapeutics, and medicine.' },
      { areaName: 'Quantum Computing', description: 'Computers that leverage quantum mechanical phenomena.' },
    ];
    const researchAreas = await ResearchArea.insertMany(researchAreasData);
    console.log(`✅ Seeded ${researchAreas.length} Research Areas.`);

    // 2. Seed Keywords
    console.log('🌱 Seeding Keywords...');
    const keywordsData = [
      { keyword: 'neural networks' },
      { keyword: 'transformer models' },
      { keyword: 'large language models' },
      { keyword: 'cryptography' },
      { keyword: 'image segmentation' },
      { keyword: 'clinical decision support' },
      { keyword: 'anomaly detection' },
      { keyword: 'zero trust' },
      { keyword: 'reinforcement learning' },
      { keyword: 'bioinformatics' },
    ];
    const keywords = await Keyword.insertMany(keywordsData);
    console.log(`✅ Seeded ${keywords.length} Keywords.`);

    // 2.1 Seed Institutions
    console.log('🌱 Seeding Institutions...');
    const institutionsData = [
      {
        name: 'Stanford University',
        country: 'United States',
        type: 'Academic',
        website: 'https://stanford.edu',
        description: 'A prestigious private research university in Stanford, California.',
        departments: ['Computer Science Department', 'Bioengineering', 'Electrical Engineering'],
        stats: { researchersCount: 15, publicationsCount: 240, citationsCount: 5200 }
      },
      {
        name: 'Massachusetts Institute of Technology',
        country: 'United States',
        type: 'Academic',
        website: 'https://mit.edu',
        description: 'A world-renowned research university in Cambridge, Massachusetts.',
        departments: ['CSAIL', 'Brain and Cognitive Sciences', 'Media Lab'],
        stats: { researchersCount: 18, publicationsCount: 310, citationsCount: 7800 }
      },
      {
        name: 'University of Tokyo',
        country: 'Japan',
        type: 'Academic',
        website: 'https://u-tokyo.ac.jp',
        description: 'The leading research university in Japan.',
        departments: ['Information Science', 'Precision Engineering', 'Robotics'],
        stats: { researchersCount: 12, publicationsCount: 180, citationsCount: 3900 }
      }
    ];
    const institutions = await Institution.insertMany(institutionsData);
    console.log(`✅ Seeded ${institutions.length} Institutions.`);

    // 2.2 Seed Research Domains
    console.log('🌱 Seeding Research Domains...');
    const domainsData = [
      { name: 'Artificial Intelligence', description: 'Study of intelligent agents.', isPopular: true, isTrending: true, popularityScore: 95 },
      { name: 'Machine Learning', description: 'Algorithms that learn from data.', isPopular: true, isTrending: true, popularityScore: 92 },
      { name: 'Computer Vision', description: 'Visual perception algorithms.', isPopular: true, isTrending: false, popularityScore: 80 },
      { name: 'Natural Language Processing', description: 'Interaction between computers and languages.', isPopular: true, isTrending: true, popularityScore: 88 },
      { name: 'Cyber Security', description: 'Protecting systems and data.', isPopular: false, isTrending: true, popularityScore: 75 },
      { name: 'Blockchain', description: 'Decentralized ledger systems.', isPopular: false, isTrending: false, popularityScore: 60 },
      { name: 'Bioinformatics', description: 'Computational biology.', isPopular: false, isTrending: false, popularityScore: 65 }
    ];
    const domains = await ResearchDomain.insertMany(domainsData);
    console.log(`✅ Seeded ${domains.length} Research Domains.`);

    // 2.3 Seed Research Taxonomy
    console.log('🌱 Seeding Research Taxonomy...');
    const compSci = await ResearchTaxonomy.create({ name: 'Computer Science', description: 'Core computer science research.' });
    const aiTax = await ResearchTaxonomy.create({ name: 'Artificial Intelligence', parent: compSci._id, description: 'AI research.' });
    const mlTax = await ResearchTaxonomy.create({ name: 'Machine Learning', parent: aiTax._id, description: 'ML models.' });
    const dlTax = await ResearchTaxonomy.create({ name: 'Deep Learning', parent: mlTax._id, description: 'Neural networks.' });
    const cnnTax = await ResearchTaxonomy.create({ name: 'CNN', parent: dlTax._id, description: 'Convolutional neural networks.' });
    await ResearchTaxonomy.create({ name: 'Image Classification', parent: cnnTax._id, description: 'Classifying images into categories.' });
    console.log('✅ Seeded Research Taxonomy Hierarchy.');

    // 2.4 Seed Keyword Synonyms
    console.log('🌱 Seeding Keyword Synonyms...');
    const llmKeyword = keywords.find(k => k.keyword === 'large language models');
    const nnKeyword = keywords.find(k => k.keyword === 'neural networks');
    if (llmKeyword) {
      await KeywordSynonym.create({ keyword: llmKeyword._id, synonyms: ['llm', 'llms', 'generative ai', 'gpt'] });
    }
    if (nnKeyword) {
      await KeywordSynonym.create({ keyword: nnKeyword._id, synonyms: ['neural net', 'neural nets', 'artificial neural networks'] });
    }
    console.log('✅ Seeded Keyword Synonyms.');

    // 3. Seed Users
    console.log('🌱 Seeding Users...');
    const usersData = [
      {
        fullName: 'Dr. Sarah Jenkins',
        email: 'sarah.jenkins@stanford.edu',
        password: 'Password123!',
        role: 'researcher',
        status: 'active',
        emailVerified: true,
      },
      {
        fullName: 'Prof. Alex Rivera',
        email: 'alex.rivera@mit.edu',
        password: 'Password123!',
        role: 'researcher',
        status: 'active',
        emailVerified: true,
      },
      {
        fullName: 'Dr. Yuki Tanaka',
        email: 'yuki.tanaka@tokyo-u.ac.jp',
        password: 'Password123!',
        role: 'researcher',
        status: 'active',
        emailVerified: true,
      },
    ];
    const createdUsers = [];
    for (const u of usersData) {
      const user = new User(u);
      // Generate standard plain password since pre('save') hashes it
      await user.save();
      createdUsers.push(user);
    }
    const [sarah, alex, yuki] = createdUsers;
    console.log(`✅ Seeded ${createdUsers.length} Users.`);

    // 4. Seed Profiles
    console.log('🌱 Seeding Profiles...');
    const profilesData = [
      {
        user: sarah._id,
        bio: 'Associate Professor of Computer Science at Stanford. Specialized in clinical deep learning and NLP.',
        designation: 'Associate Professor',
        department: 'Computer Science Department',
        institution: 'Stanford University',
        country: 'United States',
        state: 'California',
        city: 'Stanford',
        highestQualification: 'PhD in Computer Science',
        experience: 12,
        phone: '+16505550192',
        website: 'https://sarahjenkins.lab.stanford.edu',
        gender: 'female',
        languages: ['English', 'Spanish'],
      },
      {
        user: alex._id,
        bio: 'Lead Researcher at CSAIL, MIT. Working on the intersection of cryptography, blockchain, and security.',
        designation: 'Principal Researcher',
        department: 'CSAIL',
        institution: 'Massachusetts Institute of Technology',
        country: 'United States',
        state: 'Massachusetts',
        city: 'Cambridge',
        highestQualification: 'PhD in Cybersecurity',
        experience: 15,
        phone: '+16175550183',
        website: 'https://csail.mit.edu/people/arivera',
        gender: 'male',
        languages: ['English', 'Portuguese'],
      },
      {
        user: yuki._id,
        bio: 'Senior Lecturer at University of Tokyo. Specializing in computer vision and autonomous robotics.',
        designation: 'Senior Lecturer',
        department: 'Information Science',
        institution: 'University of Tokyo',
        country: 'Japan',
        state: 'Tokyo',
        city: 'Bunkyo',
        highestQualification: 'PhD in Robotics',
        experience: 8,
        phone: '+81355550194',
        website: 'https://tanakalab.u-tokyo.ac.jp',
        gender: 'other',
        languages: ['Japanese', 'English'],
      },
    ];
    const profiles = [];
    for (const p of profilesData) {
      const profile = new Profile(p);
      await profile.save();
      profiles.push(profile);
    }
    console.log(`✅ Seeded ${profiles.length} Profiles (Auto-computed completions: ${profiles.map(p => p.profileCompletion).join('%, ')}%).`);

    // 5. Seed Academic Profiles
    console.log('🌱 Seeding Academic Profiles...');
    const academicProfilesData = [
      { user: sarah._id, orcid: '0000-0002-1825-0097', googleScholar: 'sarah_gs_id', scopusId: 'sarah_scopus', researchGate: 'Sarah-Jenkins-12', linkedIn: 'sarah-j-linked' },
      { user: alex._id, orcid: '0000-0003-4921-9988', googleScholar: 'alex_gs_id', scopusId: 'alex_scopus', researchGate: 'Alex-Rivera-4', linkedIn: 'alex-r-linked' },
      { user: yuki._id, orcid: '0000-0001-9012-3456', googleScholar: 'yuki_gs_id', scopusId: 'yuki_scopus', researchGate: 'Yuki-Tanaka-8', linkedIn: 'yuki-t-linked' },
    ];
    await AcademicProfile.insertMany(academicProfilesData);
    console.log('✅ Seeded Academic Profiles.');

    // 6. Connect Users to Research Areas & Keywords
    console.log('🌱 Connecting Users to Research Areas & Keywords...');
    // Sarah: AI, ML, Deep Learning, Healthcare AI
    await UserResearchArea.create([
      { user: sarah._id, researchArea: researchAreas[0]._id },
      { user: sarah._id, researchArea: researchAreas[1]._id },
      { user: sarah._id, researchArea: researchAreas[2]._id },
      { user: sarah._id, researchArea: researchAreas[8]._id },
    ]);
    // Sarah: neural networks, transformer models, large language models, clinical decision support, bioinformatics
    await UserKeyword.create([
      { user: sarah._id, keyword: keywords[0]._id },
      { user: sarah._id, keyword: keywords[1]._id },
      { user: sarah._id, keyword: keywords[2]._id },
      { user: sarah._id, keyword: keywords[5]._id },
      { user: sarah._id, keyword: keywords[9]._id },
    ]);

    // Alex: Cyber Security, Blockchain
    await UserResearchArea.create([
      { user: alex._id, researchArea: researchAreas[5]._id },
      { user: alex._id, researchArea: researchAreas[7]._id },
    ]);
    // Alex: cryptography, anomaly detection, zero trust
    await UserKeyword.create([
      { user: alex._id, keyword: keywords[3]._id },
      { user: alex._id, keyword: keywords[6]._id },
      { user: alex._id, keyword: keywords[7]._id },
    ]);

    // Yuki: Artificial Intelligence, Machine Learning, Computer Vision
    await UserResearchArea.create([
      { user: yuki._id, researchArea: researchAreas[0]._id },
      { user: yuki._id, researchArea: researchAreas[1]._id },
      { user: yuki._id, researchArea: researchAreas[4]._id },
    ]);
    // Yuki: neural networks, image segmentation, reinforcement learning
    await UserKeyword.create([
      { user: yuki._id, keyword: keywords[0]._id },
      { user: yuki._id, keyword: keywords[4]._id },
      { user: yuki._id, keyword: keywords[8]._id },
    ]);
    console.log('✅ Connected Users to Research Areas and Keywords.');

    // 6.1 Seed Research Interests for Users
    console.log('🌱 Seeding Research Interests...');
    await ResearchInterest.create([
      {
        user: sarah._id,
        domains: [domains[0]._id, domains[1]._id, domains[3]._id], // AI, ML, NLP
        keywords: [keywords[0]._id, keywords[1]._id, keywords[2]._id, keywords[5]._id] // neural networks, transformer models, LLMs, clinical decision support
      },
      {
        user: alex._id,
        domains: [domains[4]._id, domains[5]._id], // Cyber Security, Blockchain
        keywords: [keywords[3]._id, keywords[6]._id, keywords[7]._id] // cryptography, anomaly detection, zero trust
      },
      {
        user: yuki._id,
        domains: [domains[0]._id, domains[1]._id, domains[2]._id], // AI, ML, Computer Vision
        keywords: [keywords[0]._id, keywords[4]._id, keywords[8]._id] // neural networks, image segmentation, reinforcement learning
      }
    ]);
    console.log('✅ Seeded Research Interests.');

    // 7. Seed Collaboration Preferences
    console.log('🌱 Seeding Collaboration Preferences...');
    await CollaborationPreference.create([
      {
        user: sarah._id,
        openForCollaboration: true,
        collaborationStatus: 'Looking for Co-author',
        projectType: ['Joint Research', 'Grant Proposal'],
        preferredCountries: ['United States', 'Japan', 'Germany'],
        duration: '6-12 months',
        fundingRequired: true,
      },
      {
        user: alex._id,
        openForCollaboration: true,
        collaborationStatus: 'Industry Collaboration',
        projectType: ['Tech Transfer', 'Co-development'],
        preferredCountries: ['United States', 'United Kingdom'],
        duration: '1 year+',
        fundingRequired: false,
      },
      {
        user: yuki._id,
        openForCollaboration: true,
        collaborationStatus: 'Joint Research',
        projectType: ['Academic Exchange', 'Prototype Build'],
        preferredCountries: ['Japan', 'United States'],
        duration: '3-6 months',
        fundingRequired: false,
      },
    ]);
    console.log('✅ Seeded Collaboration Preferences.');

    // 8. Seed Publications & Co-authors
    console.log('🌱 Seeding Publications & Publication Authors...');
    
    // Paper 1: Sarah Jenkins' main paper
    const paper1 = new Publication({
      user: sarah._id,
      title: 'Attention-Driven Spatial Reasoning in Healthcare Diagnostics',
      abstract: 'We present an attention-based neural network architecture optimized for diagnostic spatial reasoning over 3D MRI scans, improving tumor classification accuracy.',
      doi: '10.1016/j.jbi.2026.104230',
      publisher: 'Elsevier',
      journal: 'Journal of Biomedical Informatics',
      publicationYear: 2026,
      publicationType: 'journal',
      citationCount: 42,
      pdfUrl: 'https://res.cloudinary.com/research-connect/raw/upload/papers/attention_healthcare.pdf',
      visibility: 'public',
    });
    await paper1.save();

    await PublicationAuthor.create([
      { publication: paper1._id, user: sarah._id, authorName: 'Sarah Jenkins', affiliation: 'Stanford University', email: 'sarah.jenkins@stanford.edu', authorOrder: 1, correspondingAuthor: true },
      { publication: paper1._id, authorName: 'John Doe', affiliation: 'Mayo Clinic', authorOrder: 2 },
    ]);

    // Paper 2: Co-authored between Sarah and Alex
    const paper2 = new Publication({
      user: alex._id,
      title: 'Secure Federated Learning in Distributed Healthcare Frameworks',
      abstract: 'An exploration of zero-trust cryptography applied to collaborative federated model training across medical institutions.',
      doi: '10.1109/tifs.2026.987654',
      publisher: 'IEEE',
      journal: 'IEEE Transactions on Information Forensics and Security',
      publicationYear: 2026,
      publicationType: 'journal',
      citationCount: 15,
      pdfUrl: 'https://res.cloudinary.com/research-connect/raw/upload/papers/federated_security.pdf',
      visibility: 'public',
    });
    await paper2.save();

    await PublicationAuthor.create([
      { publication: paper2._id, user: alex._id, authorName: 'Alex Rivera', affiliation: 'CSAIL, MIT', email: 'alex.rivera@mit.edu', authorOrder: 1, correspondingAuthor: true },
      { publication: paper2._id, user: sarah._id, authorName: 'Sarah Jenkins', affiliation: 'Stanford University', email: 'sarah.jenkins@stanford.edu', authorOrder: 2 },
    ]);

    // Paper 3: Yuki's paper
    const paper3 = new Publication({
      user: yuki._id,
      title: 'Real-time Object Detection and Spatial Alignment in Autonomous Micro-Robotics',
      abstract: 'Developing low-power transformer models for high-frequency edge-computing robot alignment in dense obstacle environments.',
      doi: '10.1109/lra.2026.123456',
      publisher: 'IEEE',
      journal: 'IEEE Robotics and Automation Letters',
      publicationYear: 2026,
      publicationType: 'journal',
      citationCount: 10,
      pdfUrl: 'https://res.cloudinary.com/research-connect/raw/upload/papers/robotics_alignment.pdf',
      visibility: 'public',
    });
    await paper3.save();

    await PublicationAuthor.create([
      { publication: paper3._id, user: yuki._id, authorName: 'Yuki Tanaka', affiliation: 'University of Tokyo', email: 'yuki.tanaka@tokyo-u.ac.jp', authorOrder: 1, correspondingAuthor: true },
    ]);

    // Paper 4: Add another paper for Sarah to test h-index calculations
    const paper4 = new Publication({
      user: sarah._id,
      title: 'Transformer Models for Protein Folding and Genomic Sequence Processing',
      abstract: 'Evaluating transformer attention maps to predict amino acid distances and genomic mutations.',
      doi: '10.1101/2026.01.12.12345',
      publisher: 'BioRxiv',
      journal: 'BioRxiv',
      publicationYear: 2026,
      publicationType: 'preprint',
      citationCount: 12,
      pdfUrl: 'https://res.cloudinary.com/research-connect/raw/upload/papers/protein_transformers.pdf',
      visibility: 'public',
    });
    await paper4.save();

    await PublicationAuthor.create([
      { publication: paper4._id, user: sarah._id, authorName: 'Sarah Jenkins', affiliation: 'Stanford University', email: 'sarah.jenkins@stanford.edu', authorOrder: 1, correspondingAuthor: true },
    ]);

    console.log('✅ Seeded Publications and Publication Authors.');

    // 9. Recalculate and update user profile metrics
    console.log('🌱 Invoking automatic metrics recalculations for all users...');
    await Profile.recalculateMetrics(sarah._id);
    await Profile.recalculateMetrics(alex._id);
    await Profile.recalculateMetrics(yuki._id);
    console.log('✅ Recalculated metrics.');

    // Print out the recalculated metrics to verify correctness
    const updatedSarahProfile = await Profile.findOne({ user: sarah._id });
    console.log(`   - Sarah Jenkins Profile Metrics:`);
    console.log(`     * Publications: ${updatedSarahProfile.publications} (Expected: 3 - Sarah has 3 papers: Paper 1, Paper 2, Paper 4)`);
    console.log(`     * Citations: ${updatedSarahProfile.citations} (Expected: 69 - 42 + 15 + 12)`);
    console.log(`     * h-Index: ${updatedSarahProfile.hIndex} (Expected: 3 - she has 3 papers with citations >= 3, i.e., 42, 15, 12)`);
    console.log(`     * i10-Index: ${updatedSarahProfile.i10Index} (Expected: 3 - 3 papers with >= 10 citations)`);

    // 10. Seed PublicationKeywords & PublicationResearchAreas
    console.log('🌱 Seeding Publication Keywords and Research Areas links...');
    await PublicationKeyword.create([
      { publication: paper1._id, keyword: keywords[0]._id }, // neural networks
      { publication: paper1._id, keyword: keywords[5]._id }, // clinical decision support
      { publication: paper2._id, keyword: keywords[3]._id }, // cryptography
      { publication: paper2._id, keyword: keywords[7]._id }, // zero trust
      { publication: paper3._id, keyword: keywords[1]._id }, // transformer models
      { publication: paper3._id, keyword: keywords[4]._id }, // image segmentation
    ]);

    await PublicationResearchArea.create([
      { publication: paper1._id, researchArea: researchAreas[8]._id }, // Healthcare AI
      { publication: paper2._id, researchArea: researchAreas[5]._id }, // Cyber Security
      { publication: paper3._id, researchArea: researchAreas[4]._id }, // Computer Vision
    ]);
    console.log('✅ Seeded Publication Keywords and Research Areas.');

    // 11. Seed Recommendations
    console.log('🌱 Seeding AI-calculated recommendations...');
    // We match Sarah Jenkins with Yuki Tanaka
    const rec = new Recommendation({
      researcher: sarah._id,
      recommendedResearcher: yuki._id,
      keywordScore: 85,      // 40% weight
      researchAreaScore: 90,  // 25% weight
      abstractScore: 75,      // 20% weight
      publicationScore: 60,   // 15% weight
      commonKeywords: [keywords[0]._id], // neural networks
    });
    await rec.save();
    console.log(`✅ Seeded recommendation. Final Match score: ${rec.finalMatch}% (Expected: 85*0.4 + 90*0.25 + 75*0.2 + 60*0.15 = 80.5%)`);

    // 12. Seed Followers
    console.log('🌱 Seeding follower connections...');
    await Follow.create([
      { followerId: alex._id, followingId: sarah._id },
      { followerId: yuki._id, followingId: sarah._id },
      { followerId: sarah._id, followingId: alex._id },
    ]);
    // Update cached counts
    await User.findByIdAndUpdate(alex._id, { followingCount: 1, followersCount: 1 });
    await User.findByIdAndUpdate(sarah._id, { followingCount: 1, followersCount: 2 });
    await User.findByIdAndUpdate(yuki._id, { followingCount: 1, followersCount: 0 });
    console.log('✅ Seeded Followers.');

    // 13. Seed Collaboration Request
    console.log('🌱 Seeding Collaboration Request...');
    await CollaborationRequest.create({
      sender: yuki._id,
      receiver: sarah._id,
      message: 'Hi Dr. Jenkins, I read your paper on Spatial Reasoning. I think we can combine it with our autonomous micro-robotics alignment system for high-resolution target alignment. Let me know if you are open to discuss!',
      status: 'Pending',
    });
    console.log('✅ Seeded Collaboration Request.');

    // 14. Seed Saved Publications
    console.log('🌱 Seeding Saved Publications...');
    await SavedPublication.create([
      { user: alex._id, publication: paper1._id },
      { user: yuki._id, publication: paper2._id },
    ]);
    console.log('✅ Seeded Saved Publications.');

    // 15. Seed Activity Logs, Search History, Notifications, Reports
    console.log('🌱 Seeding miscellaneous audit tables...');
    await ActivityLog.create([
      { user: sarah._id, activity: 'user_login', ipAddress: '192.168.1.10', browser: 'Chrome', device: 'Macbook Pro' },
      { user: alex._id, activity: 'profile_update', ipAddress: '192.168.1.15', browser: 'Firefox', device: 'Lenovo Thinkpad' },
    ]);

    await SearchHistory.create([
      { user: sarah._id, keyword: 'federated security', filters: { year: 2026 } },
      { user: yuki._id, keyword: 'micro-robotics alignment', filters: { type: 'journal' } },
    ]);

    await Notification.create([
      { user: sarah._id, title: 'New Collaboration Request', message: 'Yuki Tanaka sent you a collaboration proposal.', type: 'Collaboration', read: false },
      { user: sarah._id, title: 'Weekly Recommendation', message: 'We found 3 new researchers matching your criteria.', type: 'Recommendation', read: true },
    ]);

    await Report.create({
      reportedBy: alex._id,
      targetId: paper1._id,
      reportType: 'Publication',
      reason: 'Formatting issue in abstract section.',
      status: 'Pending',
    });
    console.log('✅ Seeded ActivityLogs, SearchHistories, Notifications, and Reports.');

    console.log('🚀 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();
