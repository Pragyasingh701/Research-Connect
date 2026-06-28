import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  connectUser,
  acceptConnection,
  rejectConnection,
  removeConnection,
  blockUser,
  unblockUser,
  reportUser,
  listConnections,
} from '../controllers/connection.controller.js';

const router = express.Router();

router.use(protect);

router.post('/connect/:receiverId', connectUser);
router.patch('/accept/:connectionId', acceptConnection);
router.patch('/reject/:connectionId', rejectConnection);
router.delete('/remove/:partnerId', removeConnection);

router.post('/block/:userId', blockUser);
router.delete('/unblock/:userId', unblockUser);
router.post('/report/:userId', reportUser);

router.get('/list', listConnections);

export default router;
