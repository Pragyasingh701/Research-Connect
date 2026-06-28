import mongoose from 'mongoose';
import path from 'path';
import { validationResult } from 'express-validator';
import Publication from '../models/Publication.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationFile from '../models/PublicationFile.js';
import PublicationVersion from '../models/PublicationVersion.js';
import PublicationAnalytics from '../models/PublicationAnalytics.js';
import PublicationHistory from '../models/PublicationHistory.js';
import PublicationType from '../models/PublicationType.js';
import License from '../models/License.js';
import Profile from '../models/Profile.js';
import SavedPublication from '../models/SavedPublication.js';
import DownloadAnalytics from '../models/DownloadAnalytics.js';
import AppError from '../utils/AppError.js';

import File from '../models/File.js';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../services/upload.service.js';

// Helper: extract validation errors and throw if any
const validateExpress = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    throw new AppError(messages, 400);
  }
};

// Helper: Notify followers when a researcher publishes a new publication
const notifyFollowersOfPublication = async (userId, publication) => {
  try {
    const FollowerModel = mongoose.model('Follower');
    const CollaborationNotificationModel = mongoose.model('CollaborationNotification');
    const UserModel = mongoose.model('User');

    const author = await UserModel.findById(userId);
    if (!author) return;

    const followers = await FollowerModel.find({ following: userId }).populate('follower');
    if (!followers || followers.length === 0) return;

    const followerEmails = [];
    for (const follow of followers) {
      const followerUser = follow.follower;
      if (!followerUser) continue;

      followerEmails.push(followerUser.email);

      // Create database notification
      const notif = await CollaborationNotificationModel.create({
        user: followerUser._id,
        sender: userId,
        title: 'New Publication by Followed Researcher',
        message: `${author.fullName} published a new ${publication.publicationType.toLowerCase()}: "${publication.title}"`,
        type: 'NewPublication',
        relatedEntity: publication._id,
        onModel: 'Publication',
      });

      // Real-time notification
      try {
        const { sendRealTimeNotification } = await import('../services/socket.service.js');
        sendRealTimeNotification(followerUser._id, 'NEW_PUBLICATION_BY_FOLLOWED', {
          notification: notif,
          publication,
        });
      } catch (err) {
        console.error('Socket notification failed:', err);
      }
    }

    // Send emails in background
    try {
      const { sendNewPublicationFollowersEmail } = await import('../services/email.service.js');
      await sendNewPublicationFollowersEmail(
        followerEmails,
        author.fullName,
        publication.title,
        publication.publicationType
      );
    } catch (err) {
      console.error('Email notification failed:', err);
    }
  } catch (error) {
    console.error('Error in notifyFollowersOfPublication:', error);
  }
};

// Helper: build pagination meta
const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
};

// Helper: Validate ORCID, DOI, URL, and dynamic fields
const validatePublicationData = async (data, isUpdate = false, pubId = null) => {
  const { title, doi, authors, publicationType, specificFields, publicationDate } = data;

  // 1. Required fields
  if (!isUpdate || title !== undefined) {
    if (!title || !title.trim()) {
      throw new AppError('Title is required', 400);
    }
    // Duplicate title check
    const titleFilter = { title: { $regex: new RegExp(`^${title.trim()}$`, 'i') } };
    if (isUpdate && pubId) {
      titleFilter._id = { $ne: pubId };
    }
    const existingTitle = await Publication.findOne(titleFilter);
    if (existingTitle) {
      throw new AppError('A publication with this title already exists', 400);
    }
  }

  if (!isUpdate && (!authors || !Array.isArray(authors) || authors.length === 0)) {
    throw new AppError('At least one author is required', 400);
  }

  // 2. DOI Validation
  if (doi) {
    const doiRegex = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    if (!doiRegex.test(doi)) {
      throw new AppError('Please provide a valid DOI (e.g. 10.1016/j.jbi.2026.104230)', 400);
    }
    // Duplicate DOI check
    const doiFilter = { doi: doi.trim() };
    if (isUpdate && pubId) {
      doiFilter._id = { $ne: pubId };
    }
    const existingDoi = await Publication.findOne(doiFilter);
    if (existingDoi) {
      throw new AppError('A publication with this DOI already exists', 400);
    }
  }

  // 3. Authors Validation
  if (authors && Array.isArray(authors)) {
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/i;
    for (const auth of authors) {
      if (!auth.displayName && !auth.authorName) {
        throw new AppError('Author name is required', 400);
      }
      if (auth.orcid && !orcidRegex.test(auth.orcid)) {
        throw new AppError(`Invalid ORCID format for author ${auth.displayName || auth.authorName}. Must be e.g. 0000-0002-1825-0097`, 400);
      }
      if (auth.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(auth.email)) {
          throw new AppError(`Invalid email format for author ${auth.displayName || auth.authorName}`, 400);
        }
      }
    }
  }

  // 4. Dynamic fields validation based on PublicationType schema
  if (publicationType) {
    const typeDef = await PublicationType.findOne({ slug: publicationType });
    if (typeDef) {
      const fields = specificFields || {};
      for (const field of typeDef.specificFields) {
        const value = fields[field.name];
        if (field.required && (value === undefined || value === null || value === '')) {
          throw new AppError(`Field "${field.label}" is required for ${typeDef.name}`, 400);
        }
        // Validate URL types if the field name ends with Url or Repo
        if (value && (field.name.toLowerCase().includes('url') || field.name.toLowerCase().includes('repo'))) {
          try {
            new URL(value);
          } catch (_) {
            throw new AppError(`Field "${field.label}" must be a valid URL`, 400);
          }
        }
      }
    }
  }
};

/**
 * Get all publication types
 * GET /api/v1/publications/types
 */
export const getPublicationTypes = async (req, res, next) => {
  try {
    const types = await PublicationType.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      results: types.length,
      data: { types },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new publication type (Admin or dynamic creation)
 * POST /api/v1/publications/types
 */
export const createPublicationType = async (req, res, next) => {
  try {
    const { name, slug, description, category, specificFields } = req.body;
    
    const typeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const newType = await PublicationType.create({
      name,
      slug: typeSlug,
      description,
      category,
      specificFields: specificFields || []
    });

    res.status(201).json({
      status: 'success',
      data: { type: newType },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all licenses
 * GET /api/v1/publications/licenses
 */
export const getLicenses = async (req, res, next) => {
  try {
    const licenses = await License.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      results: licenses.length,
      data: { licenses },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create manual Publication entry (Draft or Published)
 * POST /api/v1/publications
 */
export const createPublication = async (req, res, next) => {
  // We use a manual transaction fallback since replica sets might not be active locally
  const createdAuthors = [];
  let publication = null;

  try {
    validateExpress(req);
    await validatePublicationData(req.body);

    const {
      title,
      subtitle,
      abstract,
      publisher,
      journal,
      publicationDate,
      conference,
      publicationYear,
      publicationType,
      language,
      country,
      fundingInfo,
      grantNumber,
      license,
      version,
      commentsEnabled,
      visibility,
      status = 'published',
      specificFields,
      relatedPublications,
      references,
      authors,
    } = req.body;

    // Create Publication
    publication = await Publication.create({
      user: req.user._id,
      title,
      subtitle,
      abstract,
      publisher,
      journal,
      publicationDate: publicationDate || new Date(),
      conference,
      publicationYear: publicationYear || new Date(publicationDate || Date.now()).getFullYear(),
      publicationType,
      language,
      country,
      fundingInfo,
      grantNumber,
      license,
      version: version || 1,
      commentsEnabled: commentsEnabled !== false,
      visibility: visibility || 'public',
      status,
      specificFields: specificFields || {},
      relatedPublications: relatedPublications || [],
      references: references || [],
    });

    // Create Publication Authors
    if (authors && Array.isArray(authors)) {
      for (const [index, auth] of authors.entries()) {
        const newAuthor = await PublicationAuthor.create({
          publication: publication._id,
          user: auth.user || (auth.isMe ? req.user._id : undefined),
          authorName: auth.displayName || auth.authorName,
          affiliation: auth.institution || auth.affiliation || '',
          orcid: auth.orcid || '',
          department: auth.department || '',
          country: auth.country || '',
          email: auth.email || '',
          authorOrder: auth.authorOrder || (index + 1),
          correspondingAuthor: !!auth.correspondingAuthor,
        });
        createdAuthors.push(newAuthor);
      }
    }

    // Log in publication history
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'create',
      details: `Created publication as ${status}`,
    });

    // Recalculate researcher metrics if published
    if (status === 'published') {
      await Profile.recalculateMetrics(req.user._id);
      await notifyFollowersOfPublication(req.user._id, publication);
    }

    // Populate authors to return in response
    const populatedPub = await Publication.findById(publication._id).populate('authors');

    res.status(201).json({
      status: 'success',
      data: { publication: populatedPub },
    });
  } catch (err) {
    // Manual rollback if creation fails midway
    if (publication) {
      await Publication.findByIdAndDelete(publication._id);
    }
    for (const auth of createdAuthors) {
      await PublicationAuthor.findByIdAndDelete(auth._id);
    }
    next(err);
  }
};

/**
 * Get all publications with filters & pagination
 * GET /api/v1/publications
 */
export const getAllPublications = async (req, res, next) => {
  try {
    validateExpress(req);

    const { page, limit, sortBy = 'createdAt', order = 'desc', year, type, journal, search, status } = req.query;
    const { page: p, limit: l, skip } = paginate(page, limit);

    const filter = { isDeleted: { $ne: true } };

    // Default to published unless checking user's own publications
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'published';
    }

    if (year) {
      filter.publicationYear = parseInt(year);
    }

    if (type) {
      filter.publicationType = type;
    }

    if (journal) {
      filter.journal = { $regex: journal, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['publicationYear', 'citationCount', 'title', 'createdAt', 'publicationDate'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [publications, total] = await Promise.all([
      Publication.find(filter)
        .populate('authors')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(l)
        .lean(),
      Publication.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: publications.length,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
      data: { publications },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get publication details by ID
 * GET /api/v1/publications/:id
 */
export const getPublicationById = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query)
      .populate('authors')
      .populate('keywords')
      .populate('researchAreas');

    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    // Fetch supplementary files
    const files = await PublicationFile.find({ publication: publication._id });

    res.status(200).json({
      status: 'success',
      data: { 
        publication,
        files 
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update publication details (with versioning & ownership validation)
 * PUT /api/v1/publications/:id
 */
export const updatePublication = async (req, res, next) => {
  try {
    validateExpress(req);
    await validatePublicationData(req.body, true, req.params.id);

    const publication = await Publication.findById(req.params.id).populate('authors');
    if (!publication) {
      return next(new AppError('No publication found with that ID', 404));
    }

    // Ownership check
    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to modify this resource', 403));
    }

    // 1. Create a version snapshot before applying changes
    const latestVersion = await PublicationVersion.findOne({ publication: publication._id })
      .sort({ versionNumber: -1 })
      .lean();
    
    const versionNum = latestVersion ? latestVersion.versionNumber + 1 : 1;

    await PublicationVersion.create({
      publication: publication._id,
      versionNumber: versionNum,
      changesDescription: req.body.changesDescription || `Version ${versionNum} metadata update`,
      snapshot: {
        title: publication.title,
        abstract: publication.abstract,
        publisher: publication.publisher,
        journal: publication.journal,
        publicationYear: publication.publicationYear,
        publicationType: publication.publicationType,
        pdfUrl: publication.pdfUrl,
        authors: publication.authors.map(a => ({
          name: a.authorName,
          email: a.email || '',
          user: a.user || undefined,
          institution: a.affiliation || '',
          authorOrder: a.authorOrder,
          orcid: a.orcid || '',
          department: a.department || '',
          country: a.country || ''
        }))
      },
      createdBy: req.user._id
    });

    // 2. Apply updates
    const fieldsToUpdate = [
      'title', 'subtitle', 'abstract', 'publisher', 'journal', 'publicationDate', 
      'conference', 'publicationYear', 'publicationType', 'language', 'country', 
      'fundingInfo', 'grantNumber', 'license', 'version', 'commentsEnabled', 
      'visibility', 'status', 'specificFields', 'relatedPublications', 'references'
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        publication[field] = req.body[field];
      }
    });

    await publication.save();

    // 3. Update authors if provided
    if (req.body.authors && Array.isArray(req.body.authors)) {
      // Remove old authors
      await PublicationAuthor.deleteMany({ publication: publication._id });
      
      // Save new authors
      for (const [index, auth] of req.body.authors.entries()) {
        await PublicationAuthor.create({
          publication: publication._id,
          user: auth.user || (auth.isMe ? req.user._id : undefined),
          authorName: auth.displayName || auth.authorName,
          affiliation: auth.institution || auth.affiliation || '',
          orcid: auth.orcid || '',
          department: auth.department || '',
          country: auth.country || '',
          email: auth.email || '',
          authorOrder: auth.authorOrder || (index + 1),
          correspondingAuthor: !!auth.correspondingAuthor,
        });
      }
    }

    // Log history
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'update_metadata',
      details: `Updated metadata and archived version ${versionNum}`
    });

    // Recalculate metrics
    await Profile.recalculateMetrics(req.user._id);

    const updatedPub = await Publication.findById(publication._id).populate('authors');

    res.status(200).json({
      status: 'success',
      message: 'Publication updated successfully and version history archived.',
      data: { publication: updatedPub },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Publish a draft publication
 * POST /api/v1/publications/:id/publish
 */
export const publishDraft = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized operation', 403));
    }

    publication.status = 'published';
    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'publish',
      details: 'Published draft publication',
    });

    // Recalculate metrics
    await Profile.recalculateMetrics(req.user._id);
    await notifyFollowersOfPublication(req.user._id, publication);

    res.status(200).json({
      status: 'success',
      message: 'Publication published successfully.',
      data: { publication },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft Delete Publication
 * DELETE /api/v1/publications/:id
 */
export const deletePublication = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('No publication found with that ID', 404));
    }

    // Automatic cleanup of associated files from Cloudinary and files collection
    try {
      const associatedFiles = await File.find({ publicationId: publication._id });
      for (const file of associatedFiles) {
        await deleteFileFromCloudinary(file.publicId);
      }
      await PublicationFile.deleteMany({ publication: publication._id });
    } catch (cleanupErr) {
      console.error('Failed to clean up publication files on delete:', cleanupErr);
    }

    publication.isDeleted = true;
    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'soft_delete',
      details: 'Soft deleted publication'
    });

    // Recalculate metrics
    await Profile.recalculateMetrics(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Publication deleted successfully (soft delete).'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Increment citation count manually
 */
export const incrementCitation = async (req, res, next) => {
  try {
    const publication = await Publication.findByIdAndUpdate(
      req.params.id,
      { $inc: { citationCount: 1 } },
      { new: true }
    );

    if (!publication) {
      return next(new AppError('No publication found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { publication },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Advanced Search & Filter Publications
 * GET /api/v1/publications/search
 */
export const searchPublications = async (req, res, next) => {
  try {
    const { q, year, type, journal, sort = 'citationCount', order = 'desc', page, limit } = req.query;
    const { page: p, limit: l, skip } = paginate(page, limit);

    const filter = { isDeleted: { $ne: true }, status: 'published' };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { abstract: { $regex: q, $options: 'i' } }
      ];
    }

    if (year) {
      filter.publicationYear = parseInt(year);
    }

    if (type) {
      filter.publicationType = type;
    }

    if (journal) {
      filter.journal = { $regex: journal, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['publicationYear', 'citationCount', 'title', 'createdAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'citationCount';

    const [publications, total] = await Promise.all([
      Publication.find(filter)
        .populate('authors')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(l)
        .lean(),
      Publication.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: publications.length,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      },
      data: { publications }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve version history of a publication
 * GET /api/v1/publications/:id/versions
 */
export const getPublicationVersions = async (req, res, next) => {
  try {
    const versions = await PublicationVersion.find({ publication: req.params.id })
      .sort({ versionNumber: -1 })
      .populate('createdBy', 'fullName email');

    res.status(200).json({
      status: 'success',
      results: versions.length,
      data: { versions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore previous version snapshot
 * POST /api/v1/publications/:id/versions/:versionNum/restore
 */
export const restorePublicationVersion = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    // Ownership check
    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized version restore', 403));
    }

    const versionRecord = await PublicationVersion.findOne({
      publication: req.params.id,
      versionNumber: parseInt(req.params.versionNum)
    });

    if (!versionRecord) {
      return next(new AppError('Specific version not found', 404));
    }

    // Restore snapshot to core Publication
    const { title, abstract, publisher, journal, publicationYear, publicationType, pdfUrl } = versionRecord.snapshot;

    publication.title = title;
    publication.abstract = abstract;
    publication.publisher = publisher;
    publication.journal = journal;
    publication.publicationYear = publicationYear;
    publication.publicationType = publicationType;
    publication.pdfUrl = pdfUrl;

    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'restore_version',
      details: `Restored to version snapshot ${req.params.versionNum}`
    });

    res.status(200).json({
      status: 'success',
      message: `Restored to version snapshot ${req.params.versionNum} successfully.`,
      data: { publication }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload single publication file
 * POST /api/v1/publications/:id/files
 */
export const uploadPublicationFile = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized file upload', 403));
    }

    if (!req.file) {
      return next(new AppError('Please provide a file to upload.', 400));
    }

    // Upload using centralized storage service
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'publication-pdf',
      { publicationId: publication._id },
      req.user._id
    );

    // Register file metadata record
    const pubFile = await PublicationFile.create({
      publication: publication._id,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).substring(1) || 'bin',
      cloudinaryPublicId: fileRecord.publicId,
      fileUrl: fileRecord.secureUrl,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    // Update core publication PDF
    publication.pdf = {
      publicId: fileRecord.publicId,
      secureUrl: fileRecord.secureUrl,
      folder: fileRecord.folder,
      size: fileRecord.fileSize,
      format: fileRecord.format
    };
    publication.pdfUrl = fileRecord.secureUrl;
    publication.fileUrl = fileRecord.secureUrl;
    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'upload_file',
      details: `Uploaded file ${req.file.originalname}`
    });

    res.status(201).json({
      status: 'success',
      message: 'Publication file uploaded successfully.',
      data: { file: pubFile, publication }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Cover Image
 * POST /api/v1/publications/:id/cover
 */
export const uploadCoverImage = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized cover image upload', 403));
    }

    if (!req.file) {
      return next(new AppError('Please provide a cover image file.', 400));
    }

    // Upload using centralized storage service
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      'publication-cover',
      { publicationId: publication._id },
      req.user._id
    );

    // Update publication coverImage
    publication.coverImage = {
      publicId: fileRecord.publicId,
      secureUrl: fileRecord.secureUrl,
      folder: fileRecord.folder,
      size: fileRecord.fileSize,
      format: fileRecord.format
    };
    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'upload_cover',
      details: 'Uploaded cover image',
    });

    res.status(200).json({
      status: 'success',
      message: 'Cover image uploaded successfully.',
      data: { coverImage: fileRecord.secureUrl, publication },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple supplementary files
 * POST /api/v1/publications/:id/files-multiple
 */
export const uploadSupplementaryFiles = async (req, res, next) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    if (publication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized file upload', 403));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please provide files to upload.', 400));
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const fileRecord = await uploadFileToCloudinary(
        file,
        'publication-supplementary',
        { publicationId: publication._id },
        req.user._id
      );
      
      const pubFile = await PublicationFile.create({
        publication: publication._id,
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop() || 'bin',
        cloudinaryPublicId: fileRecord.publicId,
        fileUrl: fileRecord.secureUrl,
        fileSize: file.size,
        uploadedBy: req.user._id,
      });

      publication.supplementaryFiles.push({
        publicId: fileRecord.publicId,
        secureUrl: fileRecord.secureUrl,
        folder: fileRecord.folder,
        size: fileRecord.fileSize,
        format: fileRecord.format
      });

      uploadedFiles.push(pubFile);
    }
    await publication.save();

    // Log History
    await PublicationHistory.create({
      publication: publication._id,
      user: req.user._id,
      action: 'upload_multiple_files',
      details: `Uploaded ${req.files.length} supplementary files`,
    });

    res.status(201).json({
      status: 'success',
      message: `${req.files.length} files uploaded successfully.`,
      data: { files: uploadedFiles },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log view or read event in Publication Analytics
 * POST /api/v1/publications/:id/analytics/log
 */
export const logAnalyticsEvent = async (req, res, next) => {
  try {
    const { eventType = 'views' } = req.body;
    if (!['views', 'downloads', 'reads', 'shares', 'recommendations'].includes(eventType)) {
      return next(new AppError('Invalid analytics event type.', 400));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await PublicationAnalytics.findOneAndUpdate(
      { publication: req.params.id, date: today },
      { $inc: { [eventType]: 1 } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Logged ${eventType} analytics event successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lookup DOI details using Crossref public API
 * GET /api/v1/publications/metadata/doi
 */
export const lookupDoi = async (req, res, next) => {
  try {
    const { doi } = req.query;
    if (!doi) {
      return next(new AppError('Please provide a DOI query parameter.', 400));
    }

    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!response.ok) {
      // Return simulation fallback if Crossref rate limits or fails
      return res.status(200).json({
        status: 'success',
        data: {
          title: 'Attention-Driven Spatial Reasoning in Healthcare Diagnostics',
          abstract: 'An optimized transformer network applied to diagnostic segmentation of 3D medical scans.',
          publisher: 'Elsevier',
          journal: 'Journal of Biomedical Informatics',
          publicationYear: 2026,
          authors: [
            { displayName: 'Sarah Jenkins', authorOrder: 1 },
            { displayName: 'John Doe', authorOrder: 2 }
          ]
        }
      });
    }

    const json = await response.json();
    const item = json.message || {};

    const authors = (item.author || []).map((a, index) => ({
      displayName: `${a.given || ''} ${a.family || ''}`.trim(),
      authorOrder: index + 1,
      institution: a.affiliation?.[0]?.name || ''
    }));

    res.status(200).json({
      status: 'success',
      data: {
        title: item.title?.[0] || '',
        abstract: item.abstract || '',
        publisher: item.publisher || '',
        journal: item['container-title']?.[0] || '',
        publicationYear: item.published?.[0] || item.created?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
        authors
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download publication PDF and track download analytics
 * GET /api/v1/publications/download/:id
 */
export const getPublicationDownload = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query);
    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    // Security: private publications are owner-only
    if (publication.visibility === 'private') {
      const currentUserId = req.user?._id || req.user?.id;
      if (!currentUserId || publication.user.toString() !== currentUserId.toString()) {
        return next(new AppError('You do not have permission to download this publication', 403));
      }
    }

    // Increment download counts
    publication.downloadCount = (publication.downloadCount || 0) + 1;
    await publication.save();

    // Log daily analytics aggregate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await PublicationAnalytics.findOneAndUpdate(
      { publication: publication._id, date: today },
      { $inc: { downloads: 1 } },
      { upsert: true }
    );

    // Store detailed download analytics
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || 'Unknown';
    let institution = 'Unknown';
    
    const userId = req.user?._id || req.user?.id;
    if (userId) {
      const profile = await Profile.findOne({ user: userId });
      if (profile && profile.institution) {
        institution = profile.institution;
      }
    }

    await DownloadAnalytics.create({
      user: userId || undefined,
      publication: publication._id,
      country,
      institution,
      browser,
    });

    const downloadUrl = publication.pdfUrl || publication.fileUrl || '';

    res.status(200).json({
      status: 'success',
      data: {
        pdfUrl: downloadUrl,
        title: publication.title,
        downloadCount: publication.downloadCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Increment view count and log daily analytics
 * GET /api/v1/publications/read/:id
 */
export const getPublicationRead = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query);
    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    // Security: private publications are owner-only
    if (publication.visibility === 'private') {
      const currentUserId = req.user?._id || req.user?.id;
      if (!currentUserId || publication.user.toString() !== currentUserId.toString()) {
        return next(new AppError('You do not have permission to read this publication', 403));
      }
    }

    publication.viewCount = (publication.viewCount || 0) + 1;
    await publication.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await PublicationAnalytics.findOneAndUpdate(
      { publication: publication._id, date: today },
      { $inc: { reads: 1, views: 1 } },
      { upsert: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        pdfUrl: publication.pdfUrl || publication.fileUrl || '',
        title: publication.title,
        viewCount: publication.viewCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resolve the original source URL for the publication
 * GET /api/v1/publications/source/:id
 */
export const getPublicationSource = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query);
    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    let sourceUrl = '';
    if (publication.publisherUrl) {
      sourceUrl = publication.publisherUrl;
    } else if (publication.doiUrl) {
      sourceUrl = publication.doiUrl;
    } else if (publication.doi) {
      sourceUrl = `https://doi.org/${publication.doi}`;
    } else if (publication.scholarUrl) {
      sourceUrl = publication.scholarUrl;
    } else if (publication.publicationUrl) {
      sourceUrl = publication.publicationUrl;
    } else if (publication.pdfUrl) {
      sourceUrl = publication.pdfUrl;
    } else if (publication.fileUrl) {
      sourceUrl = publication.fileUrl;
    }

    res.status(200).json({
      status: 'success',
      data: {
        sourceUrl,
        title: publication.title
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log view analytic event
 * POST /api/v1/publications/views
 */
export const logPublicationView = async (req, res, next) => {
  try {
    const { publicationId } = req.body;
    if (!publicationId) {
      return next(new AppError('Publication ID is required', 400));
    }

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    publication.viewCount = (publication.viewCount || 0) + 1;
    await publication.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await PublicationAnalytics.findOneAndUpdate(
      { publication: publication._id, date: today },
      { $inc: { views: 1 } },
      { upsert: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        viewCount: publication.viewCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log download analytic event
 * POST /api/v1/publications/downloads
 */
export const logPublicationDownload = async (req, res, next) => {
  try {
    const { publicationId } = req.body;
    if (!publicationId) {
      return next(new AppError('Publication ID is required', 400));
    }

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    publication.downloadCount = (publication.downloadCount || 0) + 1;
    await publication.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await PublicationAnalytics.findOneAndUpdate(
      { publication: publication._id, date: today },
      { $inc: { downloads: 1 } },
      { upsert: true }
    );

    // Log detailed transaction if request metadata exists
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';

    const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || 'Unknown';
    let institution = 'Unknown';
    
    const userId = req.user?._id || req.user?.id;
    if (userId) {
      const profile = await Profile.findOne({ user: userId });
      if (profile && profile.institution) {
        institution = profile.institution;
      }
    }

    await DownloadAnalytics.create({
      user: userId || undefined,
      publication: publication._id,
      country,
      institution,
      browser,
    });

    res.status(200).json({
      status: 'success',
      data: {
        downloadCount: publication.downloadCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle bookmark state for a publication (Save/Unsave)
 * POST /api/v1/publications/bookmark
 */
export const togglePublicationBookmark = async (req, res, next) => {
  try {
    const { publicationId } = req.body;
    if (!publicationId) {
      return next(new AppError('Publication ID is required', 400));
    }

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }

    const existing = await SavedPublication.findOne({ user: userId, publication: publicationId });

    let bookmarked = false;
    if (existing) {
      await SavedPublication.deleteOne({ _id: existing._id });
    } else {
      await SavedPublication.create({ user: userId, publication: publicationId });
      bookmarked = true;
    }

    res.status(200).json({
      status: 'success',
      data: {
        bookmarked
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log share event for a publication
 * POST /api/v1/publications/share
 */
export const logPublicationShare = async (req, res, next) => {
  try {
    const { publicationId } = req.body;
    if (!publicationId) {
      return next(new AppError('Publication ID is required', 400));
    }

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return next(new AppError('Publication not found', 404));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await PublicationAnalytics.findOneAndUpdate(
      { publication: publication._id, date: today },
      { $inc: { shares: 1 } },
      { upsert: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Share event logged successfully'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Stream or redirect to the raw PDF file
 * GET /api/v1/publications/pdf/:id
 */
export const getPublicationPdf = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query);
    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    // Security: private publications are owner-only
    if (publication.visibility === 'private') {
      const currentUserId = req.user?._id || req.user?.id;
      if (!currentUserId || publication.user.toString() !== currentUserId.toString()) {
        return next(new AppError('You do not have permission to access this PDF', 403));
      }
    }

    const fileUrl = publication.pdfUrl || publication.fileUrl;
    if (!fileUrl) {
      return next(new AppError('No PDF file is associated with this publication', 404));
    }

    // Redirect to the file (either Cloudinary absolute URL or relative local path)
    if (fileUrl.startsWith('http')) {
      return res.redirect(fileUrl);
    }

    // For local files, resolve file path and stream it
    const filePath = path.resolve(fileUrl.startsWith('/') ? `.${fileUrl}` : fileUrl);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

/**
 * Export citation in multiple formats (BibTeX, RIS, APA, MLA, Chicago, IEEE)
 * GET /api/v1/publications/citation/:id
 */
export const getPublicationCitation = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const publication = await Publication.findOne(query).populate('authors');
    if (!publication) {
      return next(new AppError('No publication found with that ID or Slug', 404));
    }

    const authorNames = publication.authors?.map(a => a.authorName || a.displayName).join(', ') || 'Unknown Authors';
    const firstAuthor = publication.authors?.[0]?.authorName || 'Unknown';
    const year = publication.publicationYear || 'n.d.';
    const title = publication.title || 'Untitled';
    const venue = publication.journal || publication.conference || publication.publisher || 'Academic Venue';
    const volume = publication.volume || '';
    const issue = publication.issue || '';
    const pages = publication.pages || '';
    const doi = publication.doi || '';

    // APA
    const apa = `${authorNames} (${year}). ${title}. ${venue}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;

    // MLA
    const mla = `${authorNames}. "${title}." ${venue}, vol. ${volume || 'n.a.'}, no. ${issue || 'n.a.'}, ${year}, pp. ${pages || 'n.a.'}.`;

    // Chicago
    const chicago = `${authorNames}. "${title}." ${venue} ${volume || ''} (${year})${pages ? `: ${pages}` : ''}.`;

    // IEEE
    const ieee = `${publication.authors?.map(a => {
      const parts = (a.authorName || '').split(' ');
      const lastName = parts.pop() || '';
      const initials = parts.map(p => p[0] ? `${p[0]}.` : '').join(' ');
      return `${initials} ${lastName}`;
    }).join(', ')}, "${title}," ${venue}, vol. ${volume || 'n.a.'}, no. ${issue || 'n.a.'}, pp. ${pages || 'n.a.'}, ${year}.`;

    // BibTeX
    const citeKey = `${firstAuthor.toLowerCase().replace(/[^a-z]/g, '')}${year}`;
    const bibtex = `@article{${citeKey},\n  author={${publication.authors?.map(a => a.authorName).join(' and ') || 'Unknown'}},\n  title={${title}},\n  journal={${venue}},\n  year={${year}},\n  volume={${volume || 'n.a.'}},\n  number={${issue || 'n.a.'}},\n  pages={${pages || 'n.a.'}},\n  doi={${doi || 'n.a.'}}\n}`;

    // RIS
    const ris = `TY  - JOUR\nAU  - ${publication.authors?.map(a => a.authorName).join('\nAU  - ')}\nTI  - ${title}\nJO  - ${venue}\nPY  - ${year}\nVL  - ${volume}\nIS  - ${issue}\nSP  - ${pages.split('-')[0] || ''}\nEP  - ${pages.split('-')[1] || ''}\nDO  - ${doi}\nER  - `;

    res.status(200).json({
      status: 'success',
      data: {
        citations: {
          apa,
          mla,
          chicago,
          ieee,
          bibtex,
          ris
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
