import express from 'express';
import * as keywordController from '../controllers/keyword.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', keywordController.getKeywords);
router.get('/my', keywordController.getMyKeywords);
router.post('/', keywordController.addKeyword);
router.delete('/:id', keywordController.removeKeyword);

router.get('/popular', keywordController.getPopularKeywords);
router.get('/trending', keywordController.getTrendingKeywords);
router.get('/suggested', keywordController.getSuggestedKeywords);
router.post('/extract', keywordController.extractKeywords);

router.get('/export', keywordController.exportKeywords);
router.post('/import', keywordController.importKeywords);

export default router;
