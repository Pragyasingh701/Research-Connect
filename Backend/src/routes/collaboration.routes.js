import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware.js';
import {
  getCollaborationStatus,
  updateCollaborationStatus,
  getCollaborationPreferences,
  saveCollaborationPreferences,
  sendCollaborationRequest,
  acceptCollaborationRequest,
  rejectCollaborationRequest,
  cancelCollaborationRequest,
  listCollaborationRequests,
  getActiveCollaborations,
  getCollaborationDetails,
  addCollaborationMessage,
  uploadCollaborationFile,
  addCollaborationMeeting,
  updateCollaborationProgress,
  getCollaborationAnalytics,
  getSuggestedCollaborators,
} from '../controllers/collaboration.controller.js';

const router = express.Router();

// Multer storage for project file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'collab-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// All routes are protected
router.use(protect);

// Collaboration Status
router.route('/status')
  .get(getCollaborationStatus)
  .patch(updateCollaborationStatus);

// Collaboration Preferences
router.route('/preferences')
  .get(getCollaborationPreferences)
  .put(saveCollaborationPreferences);

// Collaboration Requests
router.route('/requests')
  .get(listCollaborationRequests)
  .post(sendCollaborationRequest);

router.patch('/requests/:requestId/accept', acceptCollaborationRequest);
router.patch('/requests/:requestId/reject', rejectCollaborationRequest);
router.patch('/requests/:requestId/cancel', cancelCollaborationRequest);

// Active Collaborations
router.route('/projects')
  .get(getActiveCollaborations);

router.route('/projects/:id')
  .get(getCollaborationDetails);

router.post('/projects/:id/messages', addCollaborationMessage);
router.post('/projects/:id/files', upload.single('file'), uploadCollaborationFile);
router.post('/projects/:id/meetings', addCollaborationMeeting);
router.patch('/projects/:id/progress', updateCollaborationProgress);

// Analytics & AI Suggestions
router.get('/analytics', getCollaborationAnalytics);
router.get('/suggestions', getSuggestedCollaborators);

export default router;
