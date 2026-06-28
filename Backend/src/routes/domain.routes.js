import express from 'express';
import * as domainController from '../controllers/domain.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', domainController.getAllDomains);
router.post('/', domainController.createDomain);
router.get('/popular', domainController.getPopularDomains);
router.get('/trending', domainController.getTrendingDomains);
router.get('/:id', domainController.getDomainById);

export default router;
