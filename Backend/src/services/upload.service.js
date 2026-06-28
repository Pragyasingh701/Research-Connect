import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import File from '../models/File.js';

// Configuration
export let isCloudinaryConfigured = false;
export const verifyCloudinaryConnection = async () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      await cloudinary.api.ping();
      isCloudinaryConfigured = true;
      return true;
    } catch (err) {
      console.error('❌ Cloudinary connection failed:', err.message);
      isCloudinaryConfigured = false;
      return false;
    }
  } else {
    // If in production, env.js would have already failed startup.
    // In development, we can print a fallback warning.
    console.warn('⚠️ Cloudinary credentials missing. Using local storage fallback.');
    isCloudinaryConfigured = false;
    return false;
  }
};


const FOLDER_MAP = {
  'profile-image': 'Research Connect/Profile Images',
  'cover-image': 'Research Connect/Cover Images',
  'publication-pdf': 'Research Connect/Publications/PDFs',
  'publication-cover': 'Research Connect/Publications/Cover Images',
  'publication-supplementary': 'Research Connect/Publications/Supplementary Files',
  'project-file': 'Research Connect/Projects/Documents',
  'project-image': 'Research Connect/Projects/Images',
  'project-dataset': 'Research Connect/Projects/Datasets',
  'presentation': 'Research Connect/Presentations',
  'poster': 'Research Connect/Posters',
  'dataset': 'Research Connect/Datasets',
  'patent': 'Research Connect/Patents',
  'proposal': 'Research Connect/Research Proposals',
  'thesis': 'Research Connect/Thesis',
  'report': 'Research Connect/Technical Reports',
  'code': 'Research Connect/Code Archives',
  'logo': 'Research Connect/Institution Logos',
  'temp': 'Research Connect/Temporary Uploads',
};

const sanitizeFileName = (originalName) => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${cleanBase || 'file'}-${Date.now()}`;
};

export const uploadFileToCloudinary = async (file, uploadType, relatedIds = {}, userId) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const folder = FOLDER_MAP[uploadType] || 'Research Connect/Temporary Uploads';
  const cleanFileName = sanitizeFileName(file.originalname);
  const ext = path.extname(file.originalname).substring(1).toLowerCase() || 'bin';

  let uploadResult = null;
  let isLocal = !isCloudinaryConfigured;

  // Determine resource type: images -> image, videos -> video, rest -> raw (or auto)
  let resourceType = 'auto';
  if (file.mimetype.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.mimetype.startsWith('video/')) {
    resourceType = 'video';
  } else {
    resourceType = 'raw';
  }

  if (isCloudinaryConfigured) {
    try {
      const options = {
        folder: folder,
        public_id: cleanFileName,
        resource_type: resourceType,
        ...(resourceType === 'image' ? { fetch_format: 'auto', quality: 'auto' } : {}),
      };

      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, options, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Clean up local temp file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (unlinkErr) {
        console.error('Failed to delete temp file:', unlinkErr);
      }
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local:', err);
      isLocal = true;
    }
  }

  let finalUrl = '';
  let finalPublicId = '';
  let finalFolder = folder;

  if (isLocal) {
    // If local fallback, the file is already in uploads/ directory by multer
    finalUrl = `/uploads/${file.filename}`;
    finalPublicId = file.filename;
    finalFolder = 'Local Storage';
  } else {
    finalUrl = uploadResult.secure_url;
    finalPublicId = uploadResult.public_id;
  }

  // Create file record in files collection
  const newFileRecord = await File.create({
    fileName: cleanFileName + (ext ? `.${ext}` : ''),
    originalName: file.originalname,
    folder: finalFolder,
    publicId: finalPublicId,
    secureUrl: finalUrl,
    resourceType: isLocal ? 'local' : resourceType,
    format: ext,
    mimeType: file.mimetype,
    fileSize: file.size,
    width: uploadResult?.width || null,
    height: uploadResult?.height || null,
    uploadedBy: userId,
    uploadType: uploadType,
    publicationId: relatedIds.publicationId || null,
    projectId: relatedIds.projectId || null,
    profileId: relatedIds.profileId || null,
    institutionId: relatedIds.institutionId || null,
  });

  return newFileRecord;
};

export const deleteFileFromCloudinary = async (publicId) => {
  if (!publicId) return;

  // Find file in DB
  const fileRecord = await File.findOne({ publicId });

  if (isCloudinaryConfigured && publicId && !publicId.includes('.')) {
    try {
      // Determine resource type from db if available, otherwise default to 'raw' or 'image'
      const resourceType = fileRecord?.resourceType !== 'local' ? (fileRecord?.resourceType || 'auto') : 'auto';
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err);
    }
  }

  // If local fallback, delete the file from the uploads directory
  try {
    const filename = fileRecord ? fileRecord.publicId : publicId;
    const localPath = path.join('uploads', filename);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err) {
    // Silent fail if file doesn't exist locally
  }

  // Delete from DB
  await File.deleteOne({ publicId });
};

export const replaceFileInCloudinary = async (oldPublicId, newFile, uploadType, relatedIds = {}, userId) => {
  if (oldPublicId) {
    try {
      await deleteFileFromCloudinary(oldPublicId);
    } catch (err) {
      console.error('Failed to delete old file during replace:', err);
    }
  }
  return await uploadFileToCloudinary(newFile, uploadType, relatedIds, userId);
};
