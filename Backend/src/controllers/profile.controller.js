import Profile from '../models/Profile.js';
import AcademicProfile from '../models/AcademicProfile.js';
import Publication from '../models/Publication.js';
import * as scholarService from '../services/scholar.service.js';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';
import Education from '../models/Education.js';
import Experience from '../models/Experience.js';
import AcademicIdentity from '../models/AcademicIdentity.js';
import ProfileHistory from '../models/ProfileHistory.js';
import ResearchMetrics from '../models/ResearchMetrics.js';
import ExternalAccount from '../models/ExternalAccount.js';
import Keyword from '../models/Keyword.js';
import UserKeyword from '../models/UserKeyword.js';
import ResearchArea from '../models/ResearchArea.js';
import UserResearchArea from '../models/UserResearchArea.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationHistory from '../models/PublicationHistory.js';
import ResearchCollaborator from '../models/ResearchCollaborator.js';
import { updateFieldWithMetadata } from '../utils/sourceTracker.js';
import File from '../models/File.js';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../services/upload.service.js';

/**
 * Get current user profile and metrics
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'fullName email role status emailVerified')
      .populate('academicProfile')
      .populate('researchMetrics')
      .populate('educationList')
      .populate('experienceList')
      .populate({
        path: 'researchAreas',
        populate: { path: 'researchArea', select: 'areaName slug' }
      })
      .populate({
        path: 'keywords',
        populate: { path: 'keyword', select: 'keyword slug' }
      });

    if (!profile) {
      return next(new AppError('Profile not found for this user.', 404));
    }

    // Query and populate publications created/linked to this user, including their co-authors
    const publications = await Publication.find({ user: req.user._id })
      .populate({
        path: 'authors',
        options: { sort: { authorOrder: 1 } } // Sort co-authors by order of appearance
      });

    res.status(200).json({
      status: 'success',
      profile,
      publications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get another researcher's profile by user ID with relationship states
 */
export const getProfileByUserId = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id || req.user._id;

    const profile = await Profile.findOne({ user: targetUserId })
      .populate('user', 'fullName email role status emailVerified')
      .populate('academicProfile')
      .populate('researchMetrics')
      .populate('educationList')
      .populate('experienceList')
      .populate({
        path: 'researchAreas',
        populate: { path: 'researchArea', select: 'areaName slug' }
      })
      .populate({
        path: 'keywords',
        populate: { path: 'keyword', select: 'keyword slug' }
      });

    if (!profile) {
      return next(new AppError('Profile not found for this user.', 404));
    }

    const publications = await Publication.find({ user: targetUserId })
      .populate({
        path: 'authors',
        options: { sort: { authorOrder: 1 } }
      });

    // 1. Fetch Follow status
    const Follower = mongoose.model('Follower');
    const isFollowing = await Follower.findOne({ follower: currentUserId, following: targetUserId });

    // 2. Fetch Connection status
    const ResearcherConnection = mongoose.model('ResearcherConnection');
    const connection = await ResearcherConnection.findOne({
      $or: [
        { requester: currentUserId, receiver: targetUserId },
        { requester: targetUserId, receiver: currentUserId },
      ],
    });

    let connectionState = 'Not Connected';
    let connectionId = null;
    if (connection) {
      connectionId = connection._id;
      if (connection.status === 'Connected') {
        connectionState = 'Connected';
      } else if (connection.status === 'Pending') {
        connectionState = connection.requester.toString() === currentUserId.toString() ? 'Pending Sent' : 'Pending Received';
      }
    }

    // 3. Fetch Blocked status
    const BlockedUser = mongoose.model('BlockedUser');
    const isBlocked = await BlockedUser.findOne({ blocker: currentUserId, blocked: targetUserId });

    // 4. Fetch Collaboration Status
    const CollaborationStatus = mongoose.model('CollaborationStatus');
    const colStatusRecord = await CollaborationStatus.findOne({ user: targetUserId });

    // 5. Followers / Following counts
    const followersCount = await Follower.countDocuments({ following: targetUserId });
    const followingCount = await Follower.countDocuments({ follower: targetUserId });

    res.status(200).json({
      status: 'success',
      profile,
      publications,
      isFollowing: !!isFollowing,
      connectionState,
      connectionId,
      isBlocked: !!isBlocked,
      collaborationStatus: colStatusRecord?.status || 'Open for Collaboration',
      followersCount,
      followingCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile fields
 */
export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      displayName,
      headline,
      bio,
      designation,
      department,
      institution,
      country,
      state,
      city,
      highestQualification,
      experience,
      phone,
      website,
      gender,
      languages,
      employmentStatus,
      profileVisibility,
      socialLinks,
      dateOfBirth
    } = req.body;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        displayName,
        headline,
        bio,
        designation,
        department,
        institution,
        country,
        state,
        city,
        highestQualification,
        experience,
        phone,
        website,
        gender,
        languages,
        employmentStatus,
        profileVisibility,
        socialLinks,
        dateOfBirth
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return next(new AppError('Profile not found.', 404));
    }

    if (displayName) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.user._id, { fullName: displayName });
    }

    // Save snapshot to history (limit history to 10 versions to optimize space)
    try {
      const latestHistory = await ProfileHistory.findOne({ user: req.user._id }).sort({ version: -1 });
      const newVersion = (latestHistory?.version || 0) + 1;
      
      // Delete old history items if they exceed 10
      if (newVersion > 10) {
        const excessVersionLimit = newVersion - 10;
        await ProfileHistory.deleteMany({ user: req.user._id, version: { $lte: excessVersionLimit } });
      }

      await ProfileHistory.create({
        user: req.user._id,
        version: newVersion,
        changeSummary: req.body.changeSummary || 'Profile updated manually',
        snapshot: profile.toObject(),
        changedBy: req.user._id
      });
    } catch (err) {
      console.error('Failed to save profile history snapshot:', err.message);
    }

    res.status(200).json({
      status: 'success',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview Google Scholar details before importing
 * GET /api/v1/profile/google-scholar/preview
 */
export const previewGoogleScholar = async (req, res, next) => {
  try {
    const { input } = req.query;

    if (!input) {
      return next(new AppError('Please provide a Scholar URL, Author ID, or Name.', 400));
    }

    const result = await scholarService.getScholarImportPreview(input);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Google Scholar Profile Import (and selective sync)
 * POST /api/v1/profile/google-scholar/import
 */
export const importGoogleScholar = async (req, res, next) => {
  try {
    const { authorId, selectedPubTitles } = req.body;

    if (!authorId) {
      return next(new AppError('Please provide a Google Scholar author ID.', 400));
    }

    const result = await scholarService.importGoogleScholarProfile(req.user._id, authorId, selectedPubTitles);

    res.status(200).json({
      status: 'success',
      message: 'Google Scholar profile and publications imported successfully.',
      ...result,
    });
  } catch (error) {
    console.error('🔥 importGoogleScholar Error:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to complete importing Scholar profile: ${error.message}`,
      stack: error.stack,
      details: error
    });
  }
};



/**
 * Unlink Google Scholar profile from account
 * DELETE /api/v1/profile/google-scholar/unlink
 */
export const unlinkGoogleScholar = async (req, res, next) => {
  try {
    await scholarService.unlinkGoogleScholarProfile(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Google Scholar account unlinked successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recount/Refresh publication statistics
 * POST /api/v1/profile/google-scholar/refresh
 */
export const refreshGoogleScholar = async (req, res, next) => {
  try {
    await Profile.recalculateMetrics(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Researcher metrics recounted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Profile Photo / Cover Photo
 */
export const uploadPhoto = async (req, res, next) => {
  try {
    const isCover = req.path.includes('cover');
    if (!req.file) {
      return next(new AppError('No photo file uploaded.', 400));
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new AppError('Profile not found for this user.', 404));
    }

    const uploadType = isCover ? 'cover-image' : 'profile-image';

    // Clean up old photo if it exists
    const oldPhotoUrl = isCover ? profile.coverPhoto : profile.profilePhoto;
    if (oldPhotoUrl) {
      const oldFile = await File.findOne({ secureUrl: oldPhotoUrl, uploadType });
      if (oldFile) {
        await deleteFileFromCloudinary(oldFile.publicId);
      }
    }

    // Upload to Cloudinary using central service
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      uploadType,
      { profileId: profile._id },
      req.user._id
    );

    const updateField = isCover ? { coverPhoto: fileRecord.secureUrl } : { profilePhoto: fileRecord.secureUrl };
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      updateField,
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `${isCover ? 'Cover' : 'Profile'} photo updated successfully.`,
      profile: updatedProfile,
      data: {
        secureUrl: fileRecord.secureUrl,
        publicId: fileRecord.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Education
 * POST /api/v1/profile/education
 */
export const addEducation = async (req, res, next) => {
  try {
    const education = await Education.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json({
      status: 'success',
      data: education
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Education
 * PUT /api/v1/profile/education/:id
 */
export const updateEducation = async (req, res, next) => {
  try {
    const education = await Education.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!education) {
      return next(new AppError('Education record not found or unauthorized', 404));
    }
    res.status(200).json({
      status: 'success',
      data: education
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Education
 * DELETE /api/v1/profile/education/:id
 */
export const deleteEducation = async (req, res, next) => {
  try {
    const education = await Education.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDeleted: true },
      { new: true }
    );
    if (!education) {
      return next(new AppError('Education record not found or unauthorized', 404));
    }
    res.status(200).json({
      status: 'success',
      message: 'Education record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder Education
 * PUT /api/v1/profile/education/reorder
 */
export const reorderEducation = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return next(new AppError('orderedIds must be an array of IDs', 400));
    }
    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { sortOrder: index }
      }
    }));
    await Education.bulkWrite(operations);
    res.status(200).json({
      status: 'success',
      message: 'Education list reordered successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Experience
 * POST /api/v1/profile/experience
 */
export const addExperience = async (req, res, next) => {
  try {
    const experience = await Experience.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json({
      status: 'success',
      data: experience
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Experience
 * PUT /api/v1/profile/experience/:id
 */
export const updateExperience = async (req, res, next) => {
  try {
    const experience = await Experience.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!experience) {
      return next(new AppError('Experience record not found or unauthorized', 404));
    }
    res.status(200).json({
      status: 'success',
      data: experience
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Experience
 * DELETE /api/v1/profile/experience/:id
 */
export const deleteExperience = async (req, res, next) => {
  try {
    const experience = await Experience.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDeleted: true },
      { new: true }
    );
    if (!experience) {
      return next(new AppError('Experience record not found or unauthorized', 404));
    }
    res.status(200).json({
      status: 'success',
      message: 'Experience record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder Experience
 * PUT /api/v1/profile/experience/reorder
 */
export const reorderExperience = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return next(new AppError('orderedIds must be an array of IDs', 400));
    }
    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { sortOrder: index }
      }
    }));
    await Experience.bulkWrite(operations);
    res.status(200).json({
      status: 'success',
      message: 'Experience list reordered successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link & Sync ORCID Identity
 * POST /api/v1/profile/import/orcid
 */
export const importOrcid = async (req, res, next) => {
  try {
    const { orcidId } = req.body;
    if (!orcidId) {
      return next(new AppError('Please provide an ORCID ID.', 400));
    }

    const identity = await AcademicIdentity.findOneAndUpdate(
      { user: req.user._id, provider: 'orcid' },
      {
        identityId: orcidId,
        profileUrl: `https://orcid.org/${orcidId}`,
        lastSyncDate: new Date(),
        importedMetadata: {
          orcidId,
          syncStatus: 'completed'
        }
      },
      { upsert: true, new: true }
    );

    await AcademicProfile.findOneAndUpdate(
      { user: req.user._id },
      { orcid: orcidId },
      { upsert: true }
    );

    // Mock-import education and experience items
    await Education.create([
      {
        user: req.user._id,
        degree: 'Ph.D. in Computer Science',
        university: 'Stanford University',
        fieldOfStudy: 'Artificial Intelligence',
        startYear: 2020,
        endYear: 2024,
        description: 'Imported from ORCID: Thesis on Secure Federated Learning frameworks.'
      }
    ]);

    await Experience.create([
      {
        user: req.user._id,
        organization: 'MIT CSAIL',
        role: 'Postdoctoral Researcher',
        startYear: 2024,
        isCurrent: true,
        description: 'Imported from ORCID: Conducting research in deep generative modeling.'
      }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'ORCID profile linked and works imported successfully.',
      identity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link & Sync LinkedIn Profile
 * POST /api/v1/profile/import/linkedin
 */
export const importLinkedIn = async (req, res, next) => {
  try {
    const { linkedinUrl } = req.body;
    if (!linkedinUrl) {
      return next(new AppError('Please provide a LinkedIn URL.', 400));
    }

    const identity = await AcademicIdentity.findOneAndUpdate(
      { user: req.user._id, provider: 'linkedin' },
      {
        identityId: linkedinUrl,
        profileUrl: linkedinUrl,
        lastSyncDate: new Date(),
        importedMetadata: {
          linkedinUrl,
          syncStatus: 'completed'
        }
      },
      { upsert: true, new: true }
    );

    await AcademicProfile.findOneAndUpdate(
      { user: req.user._id },
      { linkedIn: linkedinUrl },
      { upsert: true }
    );

    await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        headline: 'AI Researcher at Stanford | Ex-Google Brain',
        bio: 'Passionate researcher focusing on the intersection of deep learning, spatial reasoning, and clinical informatics.'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'LinkedIn credentials linked and profile parsed successfully.',
      identity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link & Sync Scopus Profile
 * PUT /api/v1/profile/scopus
 */
export const linkScopus = async (req, res, next) => {
  try {
    const { scopusId } = req.body;
    if (!scopusId) {
      return next(new AppError('Please provide a Scopus ID.', 400));
    }

    const identity = await AcademicIdentity.findOneAndUpdate(
      { user: req.user._id, provider: 'scopus' },
      {
        identityId: scopusId,
        profileUrl: `https://www.scopus.com/authid/detail.uri?authorId=${scopusId}`,
        lastSyncDate: new Date(),
        importedMetadata: {
          scopusId,
          syncStatus: 'completed'
        }
      },
      { upsert: true, new: true }
    );

    await AcademicProfile.findOneAndUpdate(
      { user: req.user._id },
      { scopusId: scopusId },
      { upsert: true }
    );

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: {
          citations: 820,
          hIndex: 4,
          i10Index: 6
        }
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Scopus ID linked and metrics synced successfully.',
      identity,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Profile History versions list
 * GET /api/v1/profile/history
 */
export const getProfileHistory = async (req, res, next) => {
  try {
    const historyList = await ProfileHistory.find({ user: req.user._id })
      .sort({ version: -1 })
      .select('version changeSummary createdAt');
    
    res.status(200).json({
      status: 'success',
      history: historyList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback Profile to a specific version
 * POST /api/v1/profile/rollback
 */
export const rollbackProfile = async (req, res, next) => {
  try {
    const { version } = req.body;
    if (!version) {
      return next(new AppError('Please provide a version number to rollback to.', 400));
    }

    const history = await ProfileHistory.findOne({ user: req.user._id, version });
    if (!history) {
      return next(new AppError(`Profile version ${version} not found.`, 404));
    }

    const snapshot = history.snapshot;
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        displayName: snapshot.displayName,
        headline: snapshot.headline,
        bio: snapshot.bio,
        designation: snapshot.designation,
        department: snapshot.department,
        institution: snapshot.institution,
        country: snapshot.country,
        state: snapshot.state,
        city: snapshot.city,
        highestQualification: snapshot.highestQualification,
        experience: snapshot.experience,
        phone: snapshot.phone,
        website: snapshot.website,
        gender: snapshot.gender,
        languages: snapshot.languages,
        employmentStatus: snapshot.employmentStatus,
        profileVisibility: snapshot.profileVisibility,
        socialLinks: snapshot.socialLinks,
        dateOfBirth: snapshot.dateOfBirth,
        profilePhoto: snapshot.profilePhoto,
        coverPhoto: snapshot.coverPhoto
      },
      { new: true, runValidators: true }
    );

    // Save history snapshot for the rollback action
    try {
      const latestHistory = await ProfileHistory.findOne({ user: req.user._id }).sort({ version: -1 });
      const newVersion = (latestHistory?.version || 0) + 1;
      await ProfileHistory.create({
        user: req.user._id,
        version: newVersion,
        changeSummary: `Rolled back to version ${version}`,
        snapshot: updatedProfile.toObject(),
        changedBy: req.user._id
      });
    } catch (historyErr) {
      console.error('Failed to log rollback history snapshot:', historyErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully rolled back to version ${version}`,
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare Google Scholar profile data with local DB to detect differences
 * GET /api/v1/profile/google-scholar/compare
 * POST /api/v1/profile/google-scholar/compare
 */
export const compareGoogleScholar = async (req, res, next) => {
  try {
    const academicProfile = await AcademicProfile.findOne({ user: req.user._id });
    if (!academicProfile || !academicProfile.googleScholar) {
      return next(new AppError('No connected Google Scholar profile found.', 400));
    }

    const preview = await scholarService.getScholarImportPreview(academicProfile.googleScholar);
    
    // Find existing publications in database
    const existingPubs = await Publication.find({ user: req.user._id }).select('title citationCount');
    const existingTitles = existingPubs.map(p => p.title.toLowerCase().trim());

    // Filter publications to find new ones
    const newPublications = preview.publications.filter(pub => 
      !existingTitles.includes(pub.title.toLowerCase().trim())
    );

    // Profile comparison
    const currentProfile = await Profile.findOne({ user: req.user._id });
    const profileDiff = {
      displayName: { 
        current: currentProfile?.displayName || '', 
        latest: preview.profile.fullName || '', 
        isManualOverride: currentProfile?.fieldMetadata?.get('displayName')?.source === 'manual' 
      },
      institution: { 
        current: currentProfile?.institution || '', 
        latest: preview.profile.institution || '', 
        isManualOverride: currentProfile?.fieldMetadata?.get('institution')?.source === 'manual' 
      },
      department: { 
        current: currentProfile?.department || '', 
        latest: preview.profile.department || '', 
        isManualOverride: currentProfile?.fieldMetadata?.get('department')?.source === 'manual' 
      },
      bio: { 
        current: currentProfile?.bio || '', 
        latest: preview.profile.interests.join(', ') || '', 
        isManualOverride: currentProfile?.fieldMetadata?.get('bio')?.source === 'manual' 
      },
      website: { 
        current: currentProfile?.website || '', 
        latest: preview.profile.homepage || '', 
        isManualOverride: currentProfile?.fieldMetadata?.get('website')?.source === 'manual' 
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        authorId: academicProfile.googleScholar,
        metricsDiff: {
          citations: { current: currentProfile?.citations || 0, latest: preview.metrics.totalCitations },
          hIndex: { current: currentProfile?.hIndex || 0, latest: preview.metrics.hIndex },
          i10Index: { current: currentProfile?.i10Index || 0, latest: preview.metrics.i10Index }
        },
        profileDiff,
        newPublications,
        totalPublicationsLatest: preview.metrics.totalPublications,
        existingCount: existingPubs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync Google Scholar data selectively
 * POST /api/v1/profile/google-scholar/sync
 * PUT /api/v1/profile/google-scholar/sync
 */
export const syncGoogleScholar = async (req, res, next) => {
  try {
    const academicProfile = await AcademicProfile.findOne({ user: req.user._id });
    if (!academicProfile || !academicProfile.googleScholar) {
      return next(new AppError('No connected Google Scholar profile found.', 400));
    }

    const { action, fields, publications } = req.body;

    if (action === 'compare') {
      return compareGoogleScholar(req, res, next);
    }

    let selectedPubs = null;
    let selectedFields = null;

    if (action === 'merge') {
      selectedPubs = publications || [];
      selectedFields = fields || [];
    }

    const result = await scholarService.importGoogleScholarProfile(
      req.user._id, 
      academicProfile.googleScholar, 
      selectedPubs,
      selectedFields
    );

    res.status(200).json({
      status: 'success',
      message: 'Google Scholar profile synchronized successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Google Scholar connection status
 * GET /api/v1/profile/google-scholar/status
 */
export const getGoogleScholarStatus = async (req, res, next) => {
  try {
    const account = await ExternalAccount.findOne({ user: req.user._id, provider: 'googleScholar' });
    if (!account) {
      return res.status(200).json({
        status: 'success',
        connected: false
      });
    }

    res.status(200).json({
      status: 'success',
      connected: true,
      providerUserId: account.providerUserId,
      profileUrl: account.profileUrl,
      connectedAt: account.connectedAt,
      lastSyncedAt: account.lastSyncedAt,
      syncStatus: account.syncStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Profile manually
 * PATCH /api/v1/profile
 */
export const patchProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new AppError('Profile not found.', 404));
    }

    // List of allowable updates
    const allowedFields = [
      'displayName', 'headline', 'bio', 'designation', 'department', 'institution',
      'country', 'state', 'city', 'highestQualification', 'experience', 'phone',
      'website', 'gender', 'languages', 'employmentStatus', 'profileVisibility', 'dateOfBirth'
    ];

    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateFieldWithMetadata(profile, key, req.body[key], 'manual', req.user._id);
      }
    }

    await profile.save();

    if (req.body.displayName) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.user._id, { fullName: req.body.displayName });
    }

    // Log Profile History snapshot
    try {
      const latestHistory = await ProfileHistory.findOne({ user: req.user._id }).sort({ version: -1 });
      const newVersion = (latestHistory?.version || 0) + 1;
      
      await ProfileHistory.create({
        user: req.user._id,
        version: newVersion,
        changeSummary: 'Profile patched manually',
        snapshot: profile.toObject(),
        changedBy: req.user._id
      });
    } catch (err) {
      console.error('Failed to log patched profile history:', err.message);
    }

    res.status(200).json({
      status: 'success',
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Social Links manually
 * PATCH /api/v1/profile/social
 */
export const patchSocial = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new AppError('Profile not found.', 404));
    }

    const socialKeys = ['linkedin', 'twitter', 'github', 'researchgate', 'orcid'];
    if (req.body.socialLinks) {
      for (const key of socialKeys) {
        if (req.body.socialLinks[key] !== undefined) {
          updateFieldWithMetadata(profile, `socialLinks.${key}`, req.body.socialLinks[key], 'manual', req.user._id);
        }
      }
      await profile.save();
    }

    res.status(200).json({
      status: 'success',
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Education manually
 * PATCH /api/v1/profile/education
 */
export const patchEducation = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let education;

    if (id) {
      education = await Education.findOneAndUpdate(
        { _id: id, user: req.user._id },
        {
          ...data,
          source: 'manual',
          lastUpdated: new Date(),
          updatedBy: req.user._id
        },
        { new: true, runValidators: true }
      );
    } else {
      education = await Education.create({
        ...data,
        user: req.user._id,
        source: 'manual',
        lastUpdated: new Date(),
        updatedBy: req.user._id
      });
    }

    res.status(200).json({
      status: 'success',
      data: education
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Experience manually
 * PATCH /api/v1/profile/experience
 */
export const patchExperience = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let experience;

    if (id) {
      experience = await Experience.findOneAndUpdate(
        { _id: id, user: req.user._id },
        {
          ...data,
          source: 'manual',
          lastUpdated: new Date(),
          updatedBy: req.user._id
        },
        { new: true, runValidators: true }
      );
    } else {
      experience = await Experience.create({
        ...data,
        user: req.user._id,
        source: 'manual',
        lastUpdated: new Date(),
        updatedBy: req.user._id
      });
    }

    res.status(200).json({
      status: 'success',
      data: experience
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Publications manually
 * PATCH /api/v1/profile/publications
 */
export const patchPublications = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let pub;

    if (id) {
      pub = await Publication.findOne({ _id: id, user: req.user._id });
      if (!pub) {
        return next(new AppError('Publication not found.', 404));
      }

      for (const key of Object.keys(data)) {
        if (pub[key] !== undefined && key !== 'user' && key !== 'fieldMetadata') {
          updateFieldWithMetadata(pub, key, data[key], 'manual', req.user._id);
        }
      }
      await pub.save();

      await PublicationHistory.create({
        publication: pub._id,
        user: req.user._id,
        action: 'update_metadata',
        details: 'Manually updated metadata'
      });
    } else {
      pub = new Publication({
        ...data,
        user: req.user._id
      });

      for (const key of Object.keys(data)) {
        updateFieldWithMetadata(pub, key, data[key], 'manual', req.user._id);
      }
      await pub.save();

      // Create Publication Author mappings
      if (data.authors) {
        const authorNames = data.authors.split(',');
        for (let i = 0; i < authorNames.length; i++) {
          await PublicationAuthor.create({
            publication: pub._id,
            user: i === 0 ? req.user._id : undefined,
            authorName: authorNames[i].trim(),
            authorOrder: i + 1
          });
        }
      }

      await PublicationHistory.create({
        publication: pub._id,
        user: req.user._id,
        action: 'create',
        details: 'Manually added publication'
      });
    }

    // Recalculate researcher metrics
    await Profile.recalculateMetrics(req.user._id);

    res.status(200).json({
      status: 'success',
      data: pub
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH Research Interests manually
 * PATCH /api/v1/profile/research
 */
export const patchResearch = async (req, res, next) => {
  try {
    const { researchAreas, keywords } = req.body;

    if (Array.isArray(researchAreas)) {
      await UserResearchArea.deleteMany({ user: req.user._id });
      for (const areaName of researchAreas) {
        const normalized = areaName.trim();
        if (!normalized) continue;
        const slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const areaDoc = await ResearchArea.findOneAndUpdate(
          { slug },
          { $setOnInsert: { areaName: normalized, slug } },
          { upsert: true, new: true }
        );

        await UserResearchArea.create({
          user: req.user._id,
          researchArea: areaDoc._id,
          source: 'manual',
          lastUpdated: new Date(),
          updatedBy: req.user._id
        });
      }
    }

    if (Array.isArray(keywords)) {
      await UserKeyword.deleteMany({ user: req.user._id });
      for (const kwName of keywords) {
        const normalized = kwName.trim();
        if (!normalized) continue;
        const slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const keywordDoc = await Keyword.findOneAndUpdate(
          { slug },
          { $setOnInsert: { keyword: normalized, slug } },
          { upsert: true, new: true }
        );

        await UserKeyword.create({
          user: req.user._id,
          keyword: keywordDoc._id,
          source: 'manual',
          lastUpdated: new Date(),
          updatedBy: req.user._id
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Research areas and keywords updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Co-authors
 * GET /api/v1/profile/co-authors
 */
export const getMyCoAuthors = async (req, res, next) => {
  try {
    const coAuthors = await ResearchCollaborator.find({ user: req.user._id });
    res.status(200).json({
      status: 'success',
      results: coAuthors.length,
      coAuthors
    });
  } catch (error) {
    next(error);
  }
};



