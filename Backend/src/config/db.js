import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedPublicationTypes, seedLicenses } from '../database/seeder.js';
import logger from '../utils/logger.js';

import ResearchTaxonomy from '../models/ResearchTaxonomy.js';
import ResearchCollaborator from '../models/ResearchCollaborator.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research_connect');

    logger.info(`MongoDB Connected Successfully: ${conn.connection.host}`);
    
    // Trigger self-seeding for publication types and licenses
    await seedPublicationTypes();
    await seedLicenses();

    // Trigger self-seeding for taxonomy if empty
    try {
      const taxonomyCount = await ResearchTaxonomy.countDocuments();
      if (taxonomyCount === 0) {
        logger.info('Database is empty of taxonomy nodes. Auto-seeding default Research Taxonomy...');
        const compSci = await ResearchTaxonomy.create({ name: 'Computer Science', description: 'Core computer science research.' });
        const aiTax = await ResearchTaxonomy.create({ name: 'Artificial Intelligence', parent: compSci._id, description: 'AI research.' });
        const mlTax = await ResearchTaxonomy.create({ name: 'Machine Learning', parent: aiTax._id, description: 'ML models.' });
        const dlTax = await ResearchTaxonomy.create({ name: 'Deep Learning', parent: mlTax._id, description: 'Neural networks.' });
        const cnnTax = await ResearchTaxonomy.create({ name: 'CNN', parent: dlTax._id, description: 'Convolutional neural networks.' });
        await ResearchTaxonomy.create({ name: 'Image Classification', parent: cnnTax._id, description: 'Classifying images into categories.' });
        logger.info('Auto-seeded default Research Taxonomy successfully.');
      }
    } catch (taxErr) {
      logger.error('Failed to auto-seed taxonomy:', taxErr.message);
    }

    // Trigger self-seeding for co-authors if empty
    try {
      const User = mongoose.model('User');
      const sarahUser = await User.findOne({ email: 'sarah.jenkins@stanford.edu' });
      if (sarahUser) {
        const collaboratorCount = await ResearchCollaborator.countDocuments({ user: sarahUser._id });
        if (collaboratorCount === 0) {
          logger.info('Seeding default Co-Author (Prof. Alex Rivera) for Sarah Jenkins...');
          await ResearchCollaborator.create({
            user: sarahUser._id,
            name: 'Prof. Alex Rivera',
            scholarId: 'alex_gs_id',
            scholarUrl: 'https://scholar.google.com/citations?user=alex_gs_id',
            affiliation: 'CSAIL, MIT'
          });
          logger.info('Default Co-Author seeded successfully.');
        }
      }
    } catch (collabErr) {
      logger.error('Failed to auto-seed co-author:', collabErr.message);
    }
    
    // Bind connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};


export default connectDB;
