import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware.js';
import {
  createProject,
  updateProject,
  getProjectDetails,
  deleteProject,
  archiveProject,
  listProjects,
  inviteMember,
  respondToInvite,
  removeMember,
  updateMemberRole,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  uploadProjectFile,
  replaceProjectFile,
  deleteProjectFile,
  getFileVersions,
  linkPublication,
  unlinkPublication,
  updateProjectFunding,
  getProjectComments,
  addComment,
  getProjectAnalytics,
  getAiSuggestions,
  followProject,
  unfollowProject,
  joinProject,
} from '../controllers/project.controller.js';

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB Limit
  fileFilter: (req, file, cb) => {
    const allowedExts = /pdf|docx|doc|ppt|pptx|zip|tar|gz|csv|xlsx|xls|json|png|jpg|jpeg|gif|webp|mp4|webm|txt|py|js|ts|cpp|java|go|rs|r/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.test(ext)) {
      return cb(null, true);
    }
    cb(new Error(`File format ${ext} is not supported for project uploads.`));
  },
});

const router = Router();

// Secure all endpoints below this line
router.use(protect);

// Projects CRUD
router.route('/')
  .get(listProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectDetails)
  .put(updateProject)
  .delete(deleteProject);

router.patch('/:id/archive', archiveProject);
router.post('/:id/follow', followProject);
router.post('/:id/unfollow', unfollowProject);
router.post('/:id/join', joinProject);

// Team Members
router.post('/:id/members/invite', inviteMember);
router.post('/:id/members/respond', respondToInvite);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId', updateMemberRole);

// Tasks
router.post('/:id/tasks', createTask);
router.route('/:id/tasks/:taskId')
  .put(updateTask)
  .delete(deleteTask);
router.patch('/:id/tasks/:taskId/status', changeTaskStatus);

// Files
router.post('/:id/files', fileUpload.single('file'), uploadProjectFile);
router.post('/:id/files/:fileId/replace', fileUpload.single('file'), replaceProjectFile);
router.delete('/:id/files/:fileId', deleteProjectFile);
router.get('/files/:fileId/versions', getFileVersions);

// Publications
router.post('/:id/publications', linkPublication);
router.delete('/:id/publications/:publicationId', unlinkPublication);

// Funding
router.route('/:id/funding')
  .put(updateProjectFunding)
  .post(updateProjectFunding); // Alias for creation/update

// Comments & Collaboration
router.route('/:id/comments')
  .get(getProjectComments)
  .post(addComment);

// Analytics
router.get('/:id/analytics', getProjectAnalytics);

// AI Assistant
router.get('/:id/ai-suggestions', getAiSuggestions);

export default router;
