import express from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import profileRouter from './profile.routes.js';
import feedRouter from './feed.routes.js';
import publicationRouter from './publication.routes.js';
import dashboardRouter from './dashboard.routes.js';
import recommendationRouter from './recommendation.routes.js';
import domainRouter from './domain.routes.js';
import keywordRouter from './keyword.routes.js';
import taxonomyRouter from './taxonomy.routes.js';
import searchRouter from './search.routes.js';
import collaborationRouter from './collaboration.routes.js';
import connectionRouter from './connection.routes.js';
import followRouter from './follow.routes.js';
import projectRouter from './project.routes.js';
import uploadRouter from './upload.routes.js';

const router = express.Router();

// Mount API Sub-routers
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/feed', feedRouter);
router.use('/publications', publicationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/recommendations', recommendationRouter);
router.use('/domains', domainRouter);
router.use('/keywords', keywordRouter);
router.use('/taxonomy', taxonomyRouter);
router.use('/search', searchRouter);
router.use('/collaboration', collaborationRouter);
router.use('/connections', connectionRouter);
router.use('/projects', projectRouter);
router.use('/upload', uploadRouter);
router.use('/', followRouter);

export default router;

