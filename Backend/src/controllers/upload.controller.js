import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  replaceFileInCloudinary,
} from '../services/upload.service.js';
import Profile from '../models/Profile.js';
import File from '../models/File.js';
import Publication from '../models/Publication.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

// Helper to standardise successful upload response
const sendUploadResponse = (res, fileRecord) => {
  res.status(201).json({
    status: 'success',
    data: {
      _id: fileRecord._id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      folder: fileRecord.folder,
      publicId: fileRecord.publicId,
      secureUrl: fileRecord.secureUrl,
      resourceType: fileRecord.resourceType,
      format: fileRecord.format,
      size: fileRecord.fileSize,
      mimeType: fileRecord.mimeType,
      uploadedBy: fileRecord.uploadedBy,
      publicationId: fileRecord.publicationId,
      projectId: fileRecord.projectId,
      profileId: fileRecord.profileId,
      institutionId: fileRecord.institutionId,
      createdAt: fileRecord.createdAt,
      updatedAt: fileRecord.updatedAt,
    },
  });
};

export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide an image file to upload.', 400));
    }

    // Find user's profile
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new AppError('Profile not found for this user.', 404));
    }

    // Clean up old profile picture if exists in files
    if (profile.profilePhoto) {
      // Find old file record
      const oldFile = await File.findOne({ secureUrl: profile.profilePhoto, uploadType: 'profile-image' });
      if (oldFile) {
        await deleteFileFromCloudinary(oldFile.publicId);
      }
    }

    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'profile-image',
      { profileId: profile._id },
      req.user._id
    );

    // Update Profile
    profile.profilePhoto = fileRecord.secureUrl;
    await profile.save();

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadPublicationPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide a PDF file.', 400));
    }

    const { publicationId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'publication-pdf',
      { publicationId },
      req.user._id
    );

    if (publicationId) {
      const pub = await Publication.findById(publicationId);
      if (pub) {
        pub.pdf = {
          publicId: fileRecord.publicId,
          secureUrl: fileRecord.secureUrl,
          folder: fileRecord.folder,
          size: fileRecord.fileSize,
          format: fileRecord.format,
        };
        await pub.save();
      }
    }

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadPublicationCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide an image file.', 400));
    }

    const { publicationId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'publication-cover',
      { publicationId },
      req.user._id
    );

    if (publicationId) {
      const pub = await Publication.findById(publicationId);
      if (pub) {
        pub.coverImage = {
          publicId: fileRecord.publicId,
          secureUrl: fileRecord.secureUrl,
          folder: fileRecord.folder,
          size: fileRecord.fileSize,
          format: fileRecord.format,
        };
        await pub.save();
      }
    }

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadProjectFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide a project document.', 400));
    }

    const { projectId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'project-file',
      { projectId },
      req.user._id
    );

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadDataset = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide a dataset file.', 400));
    }

    const { publicationId, projectId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'dataset',
      { publicationId, projectId },
      req.user._id
    );

    if (publicationId) {
      const pub = await Publication.findById(publicationId);
      if (pub) {
        pub.datasets.push({
          publicId: fileRecord.publicId,
          secureUrl: fileRecord.secureUrl,
          folder: fileRecord.folder,
          size: fileRecord.fileSize,
          format: fileRecord.format,
        });
        await pub.save();
      }
    }

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadPoster = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide a poster file.', 400));
    }

    const { publicationId, projectId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'poster',
      { publicationId, projectId },
      req.user._id
    );

    if (publicationId) {
      const pub = await Publication.findById(publicationId);
      if (pub) {
        pub.posters.push({
          publicId: fileRecord.publicId,
          secureUrl: fileRecord.secureUrl,
          folder: fileRecord.folder,
          size: fileRecord.fileSize,
          format: fileRecord.format,
        });
        await pub.save();
      }
    }

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const uploadPresentation = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide a presentation file.', 400));
    }

    const { publicationId, projectId } = req.body;
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'presentation',
      { publicationId, projectId },
      req.user._id
    );

    if (publicationId) {
      const pub = await Publication.findById(publicationId);
      if (pub) {
        pub.presentations.push({
          publicId: fileRecord.publicId,
          secureUrl: fileRecord.secureUrl,
          folder: fileRecord.folder,
          size: fileRecord.fileSize,
          format: fileRecord.format,
        });
        await pub.save();
      }
    }

    sendUploadResponse(res, fileRecord);
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return next(new AppError('Please provide a file public ID.', 400));
    }

    // Find file metadata record
    const fileRecord = await File.findOne({ publicId });
    if (!fileRecord) {
      return next(new AppError('File not found in database.', 404));
    }

    // Auth check: Admin can delete anything, otherwise uploader must match
    if (fileRecord.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete this file.', 403));
    }

    // Perform cleanup and deletion from Cloudinary + File collection
    await deleteFileFromCloudinary(publicId);

    // Remove references from related publications/projects if applicable
    if (fileRecord.publicationId) {
      const pub = await Publication.findById(fileRecord.publicationId);
      if (pub) {
        // Clear pdf
        if (pub.pdf?.publicId === publicId) {
          pub.pdf = undefined;
        }
        // Clear cover image
        if (pub.coverImage?.publicId === publicId) {
          pub.coverImage = undefined;
        }
        // Clear array items
        pub.supplementaryFiles = pub.supplementaryFiles.filter((f) => f.publicId !== publicId);
        pub.datasets = pub.datasets.filter((f) => f.publicId !== publicId);
        pub.posters = pub.posters.filter((f) => f.publicId !== publicId);
        pub.presentations = pub.presentations.filter((f) => f.publicId !== publicId);
        await pub.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'File and references deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const replaceFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return next(new AppError('Please provide a file public ID to replace.', 400));
    }

    if (!req.file) {
      return next(new AppError('Please provide a new file to replace the old one.', 400));
    }

    const fileRecord = await File.findOne({ publicId });
    if (!fileRecord) {
      return next(new AppError('File not found in database.', 404));
    }

    if (fileRecord.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to replace this file.', 403));
    }

    // Call service to replace file
    const newFileRecord = await replaceFileInCloudinary(
      publicId,
      req.file,
      fileRecord.uploadType,
      {
        publicationId: fileRecord.publicationId,
        projectId: fileRecord.projectId,
        profileId: fileRecord.profileId,
        institutionId: fileRecord.institutionId,
      },
      req.user._id
    );

    // Update references in Publication or other schemas if needed
    if (fileRecord.publicationId) {
      const pub = await Publication.findById(fileRecord.publicationId);
      if (pub) {
        const replacementMeta = {
          publicId: newFileRecord.publicId,
          secureUrl: newFileRecord.secureUrl,
          folder: newFileRecord.folder,
          size: newFileRecord.fileSize,
          format: newFileRecord.format,
        };
        // Update pdf
        if (pub.pdf?.publicId === publicId) {
          pub.pdf = replacementMeta;
        }
        // Update cover
        if (pub.coverImage?.publicId === publicId) {
          pub.coverImage = replacementMeta;
        }
        // Update arrays
        pub.supplementaryFiles = pub.supplementaryFiles.map((f) => (f.publicId === publicId ? replacementMeta : f));
        pub.datasets = pub.datasets.map((f) => (f.publicId === publicId ? replacementMeta : f));
        pub.posters = pub.posters.map((f) => (f.publicId === publicId ? replacementMeta : f));
        pub.presentations = pub.presentations.map((f) => (f.publicId === publicId ? replacementMeta : f));
        await pub.save();
      }
    }

    sendUploadResponse(res, newFileRecord);
  } catch (err) {
    next(err);
  }
};
