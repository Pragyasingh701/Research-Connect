import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware.js';
import * as uploadController from '../controllers/upload.controller.js';

// Setup local disk storage for temporary multer files before upload to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Enforce image rules (PNG, JPG, JPEG, WEBP)
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and WEBP image files are allowed.'));
  }
};

// Enforce PDF rules
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents are allowed.'));
  }
};

// Permissive filters for datasets, presentations, posters, and other academic files
const researchFilter = (req, file, cb) => {
  const allowedExts = /pdf|docx|doc|ppt|pptx|zip|tar|gz|csv|xlsx|xls|json|png|jpg|jpeg|gif|webp|mp4|webm|txt|py|js|ts|cpp|java|go|rs|r|rmd|m|h|c/i;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File format ${ext} is not supported. Please upload standard research files.`));
  }
};

const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadPdfs = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const uploadResearch = multer({
  storage,
  fileFilter: researchFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const router = Router();

// Endpoints
router.post('/profile-image', protect, uploadImages.single('file'), uploadController.uploadProfileImage);
router.post('/publication-pdf', protect, uploadPdfs.single('file'), uploadController.uploadPublicationPdf);
router.post('/publication-cover', protect, uploadImages.single('file'), uploadController.uploadPublicationCover);
router.post('/project-file', protect, uploadResearch.single('file'), uploadController.uploadProjectFile);
router.post('/dataset', protect, uploadResearch.single('file'), uploadController.uploadDataset);
router.post('/poster', protect, uploadResearch.single('file'), uploadController.uploadPoster);
router.post('/presentation', protect, uploadResearch.single('file'), uploadController.uploadPresentation);

// Wildcard routing to support slashes in Cloudinary publicId
router.delete('/:publicId(*)', protect, uploadController.deleteFile);
router.patch('/:publicId(*)', protect, uploadResearch.single('file'), uploadController.replaceFile);

export default router;
