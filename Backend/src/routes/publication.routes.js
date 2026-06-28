import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createPublication,
  getAllPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
  incrementCitation,
  searchPublications,
  getPublicationVersions,
  restorePublicationVersion,
  uploadPublicationFile,
  logAnalyticsEvent,
  lookupDoi,
  getPublicationTypes,
  createPublicationType,
  getLicenses,
  uploadCoverImage,
  uploadSupplementaryFiles,
  publishDraft,
  getPublicationDownload,
  getPublicationRead,
  getPublicationSource,
  logPublicationView,
  logPublicationDownload,
  togglePublicationBookmark,
  logPublicationShare,
  getPublicationPdf,
  getPublicationCitation,
} from '../controllers/publication.controller.js';
import {
  createPublicationValidator,
  updatePublicationValidator,
  getPublicationsValidator,
  mongoIdValidator,
} from '../validations/publication.validation.js';
import { protect } from '../middleware/auth.middleware.js';

// Configure Multer Storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Permissive filter for supplementary files
const fileUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB Limit
  fileFilter: (req, file, cb) => {
    // Highly permissive for academic/research files
    const allowedExts = /pdf|docx|doc|ppt|pptx|zip|tar|gz|csv|xlsx|xls|json|png|jpg|jpeg|gif|webp|mp4|webm|txt|py|js|ts|cpp|java|go|rs|r|rmd|m|h|c/i;
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExts.test(ext)) {
      return cb(null, true);
    }
    cb(new Error(`File format ${ext} is not supported. Please upload standard research files.`));
  },
});

// Restrictive filter for cover images
const coverUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only PNG, JPG, JPEG or WEBP images are allowed as cover images.'));
  },
});

const router = Router();

// Metadata and lookups (must come before /:id)
router.get('/metadata/doi', lookupDoi);
router.get('/types', getPublicationTypes);
router.post('/types', protect, createPublicationType);
router.get('/licenses', getLicenses);
router.get('/search', searchPublications);

// Analytics, bookmark, share POST routes (must come before /:id)
router.post('/views', logPublicationView);
router.post('/downloads', logPublicationDownload);
router.post('/bookmark', protect, togglePublicationBookmark);
router.post('/share', logPublicationShare);

// GET routes (must come before /:id)
router.get('/download/:id', getPublicationDownload);
router.get('/read/:id', getPublicationRead);
router.get('/source/:id', getPublicationSource);
router.get('/pdf/:id', getPublicationPdf);
router.get('/citation/:id', getPublicationCitation);

// Core publications routes
router
  .route('/')
  .get(getPublicationsValidator, getAllPublications)
  .post(protect, createPublicationValidator, createPublication);

// GET publication detail allows ObjectId or Slug
router.get('/:id', getPublicationById);

router
  .route('/:id')
  .put(protect, mongoIdValidator, updatePublicationValidator, updatePublication)
  .delete(protect, mongoIdValidator, deletePublication);

// Publishing draft
router.post('/:id/publish', protect, mongoIdValidator, publishDraft);

// Increment citation count
router.patch('/:id/citation', mongoIdValidator, incrementCitation);

// Version history & restore
router.get('/:id/versions', protect, getPublicationVersions);
router.post('/:id/versions/:versionNum/restore', protect, restorePublicationVersion);

// Files uploads
router.post('/:id/files', protect, fileUpload.single('file'), uploadPublicationFile);
router.post('/:id/cover', protect, coverUpload.single('coverImage'), uploadCoverImage);
router.post('/:id/files-multiple', protect, fileUpload.array('files', 10), uploadSupplementaryFiles);

// Analytics logging
router.post('/:id/analytics/log', logAnalyticsEvent);

export default router;
