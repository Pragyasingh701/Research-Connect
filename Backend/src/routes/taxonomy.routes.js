import express from 'express';
import * as taxonomyController from '../controllers/taxonomy.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', taxonomyController.getTaxonomyTree);
router.get('/search', taxonomyController.searchTaxonomy);
router.post('/', taxonomyController.createTaxonomyNode);

export default router;
