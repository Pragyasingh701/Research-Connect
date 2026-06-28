import express from 'express';
import * as searchController from '../controllers/search.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/global', searchController.globalSearch);
router.get('/researchers', searchController.searchResearchers);
router.get('/publications', searchController.searchPublications);
router.get('/institutions', searchController.searchInstitutions);
router.get('/suggestions', searchController.getSuggestions);

router.get('/history', searchController.getSearchHistory);
router.delete('/history', searchController.clearSearchHistory);

router.get('/saved', searchController.getSavedSearches);
router.post('/saved', searchController.saveSearch);
router.delete('/saved/:id', searchController.deleteSavedSearch);

export default router;
