import CollaborationStatus from '../models/CollaborationStatus.js';
import CollaborationPreference from '../models/CollaborationPreference.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Collaboration from '../models/Collaboration.js';
import CollaborationHistory from '../models/CollaborationHistory.js';
import CollaborationNotification from '../models/CollaborationNotification.js';
import ResearcherSimilarity from '../models/ResearcherSimilarity.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import AppError from '../utils/AppError.js';
import { sendRealTimeNotification } from '../services/socket.service.js';
import {
  sendCollaborationRequestEmail,
  sendCollaborationRequestAcceptedEmail,
  sendCollaborationStatusChangedEmail,
} from '../services/email.service.js';

// ==========================================
// 1. COLLABORATION STATUS
// ==========================================

export const getCollaborationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let statusRecord = await CollaborationStatus.findOne({ user: userId });
    
    if (!statusRecord) {
      statusRecord = await CollaborationStatus.create({
        user: userId,
        status: 'Open for Collaboration',
      });
    }

    res.status(200).json({
      status: 'success',
      data: statusRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollaborationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, visibility } = req.body;

    let statusRecord = await CollaborationStatus.findOne({ user: userId });

    if (!statusRecord) {
      statusRecord = new CollaborationStatus({ user: userId });
    }

    if (status) statusRecord.status = status;
    if (visibility) statusRecord.visibility = visibility;

    await statusRecord.save();

    // Log in history
    await CollaborationHistory.create({
      user: userId,
      type: 'StatusChange',
      details: `Changed collaboration status to "${statusRecord.status}"`,
    });

    // Notify user via Email (mock/console fallback)
    const user = await User.findById(userId);
    if (user) {
      await sendCollaborationStatusChangedEmail(user.email, user.fullName, statusRecord.status);
    }

    // Send real-time notification
    sendRealTimeNotification(userId, 'STATUS_UPDATED', {
      status: statusRecord.status,
      lastUpdated: statusRecord.lastUpdated,
    });

    res.status(200).json({
      status: 'success',
      data: statusRecord,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. COLLABORATION PREFERENCES
// ==========================================

export const getCollaborationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let prefs = await CollaborationPreference.findOne({ user: userId });

    if (!prefs) {
      prefs = await CollaborationPreference.create({ user: userId });
    }

    res.status(200).json({
      status: 'success',
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

export const saveCollaborationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const prefsData = req.body;

    const prefs = await CollaborationPreference.findOneAndUpdate(
      { user: userId },
      { ...prefsData, user: userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. COLLABORATION REQUESTS
// ==========================================

export const sendCollaborationRequest = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const {
      receiverId,
      projectTitle,
      researchArea,
      purpose,
      expectedContribution,
      requiredSkills,
      timeline,
      fundingAvailable,
      attachments,
      message,
      priority,
    } = req.body;

    if (senderId === receiverId) {
      return next(new AppError('You cannot send a collaboration request to yourself', 400));
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new AppError('Receiver user not found', 404));
    }

    // Check for existing pending request
    const existingRequest = await CollaborationRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'Pending',
    });

    if (existingRequest) {
      return next(new AppError('You already have a pending collaboration request to this researcher', 400));
    }

    const request = await CollaborationRequest.create({
      sender: senderId,
      receiver: receiverId,
      projectTitle,
      researchArea,
      purpose,
      expectedContribution,
      requiredSkills,
      timeline,
      fundingAvailable,
      attachments,
      message,
      priority,
    });

    // Log History for sender
    await CollaborationHistory.create({
      user: senderId,
      type: 'RequestSent',
      details: `Sent collaboration request to ${receiver.fullName} for "${projectTitle}"`,
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Log History for receiver
    const sender = await User.findById(senderId);
    await CollaborationHistory.create({
      user: receiverId,
      type: 'RequestReceived',
      details: `Received collaboration request from ${sender.fullName} for "${projectTitle}"`,
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Create Notification record
    const notif = await CollaborationNotification.create({
      user: receiverId,
      sender: senderId,
      title: 'New Collaboration Request',
      message: `${sender.fullName} invited you to collaborate on "${projectTitle}"`,
      type: 'NewRequest',
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Send Real-time notification
    sendRealTimeNotification(receiverId, 'NEW_COLLABORATION_REQUEST', {
      notification: notif,
      request,
    });

    // Send Email
    await sendCollaborationRequestEmail(receiver.email, sender.fullName, projectTitle);

    res.status(201).json({
      status: 'success',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptCollaborationRequest = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;

    const request = await CollaborationRequest.findById(requestId);
    if (!request) {
      return next(new AppError('Collaboration request not found', 404));
    }

    if (request.receiver.toString() !== receiverId) {
      return next(new AppError('You are not authorized to accept this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new AppError(`Request has already been ${request.status.toLowerCase()}`, 400));
    }

    request.status = 'Accepted';
    await request.save();

    // Create Active Collaboration project workspace
    const project = await Collaboration.create({
      title: request.projectTitle,
      researchArea: request.researchArea,
      purpose: request.purpose,
      members: [request.sender, request.receiver],
      timeline: request.timeline,
      progress: 0,
      messages: [
        {
          sender: request.receiver,
          text: `Hi! I've accepted your collaboration request for "${request.projectTitle}". Let's work together!`,
        },
      ],
    });

    // Log History
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(request.sender);

    await CollaborationHistory.create({
      user: request.sender,
      type: 'RequestAccepted',
      details: `${receiver.fullName} accepted your collaboration request for "${request.projectTitle}"`,
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    await CollaborationHistory.create({
      user: request.sender,
      type: 'ProjectStarted',
      details: `Started active collaboration on "${request.projectTitle}"`,
      relatedEntity: project._id,
      onModel: 'Collaboration',
    });

    await CollaborationHistory.create({
      user: receiverId,
      type: 'ProjectStarted',
      details: `Started active collaboration on "${request.projectTitle}"`,
      relatedEntity: project._id,
      onModel: 'Collaboration',
    });

    // Create Notification
    const notif = await CollaborationNotification.create({
      user: request.sender,
      sender: receiverId,
      title: 'Collaboration Request Accepted',
      message: `${receiver.fullName} accepted your request for "${request.projectTitle}"`,
      type: 'RequestAccepted',
      relatedEntity: project._id,
      onModel: 'Collaboration',
    });

    // Real-time notify
    sendRealTimeNotification(request.sender, 'COLLABORATION_REQUEST_ACCEPTED', {
      notification: notif,
      project,
    });

    // Send Email
    await sendCollaborationRequestAcceptedEmail(sender.email, receiver.fullName, request.projectTitle);

    res.status(200).json({
      status: 'success',
      data: {
        request,
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectCollaborationRequest = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;

    const request = await CollaborationRequest.findById(requestId);
    if (!request) {
      return next(new AppError('Collaboration request not found', 404));
    }

    if (request.receiver.toString() !== receiverId) {
      return next(new AppError('You are not authorized to reject this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new AppError(`Request has already been ${request.status.toLowerCase()}`, 400));
    }

    request.status = 'Rejected';
    await request.save();

    const receiver = await User.findById(receiverId);

    // Log History
    await CollaborationHistory.create({
      user: request.sender,
      type: 'RequestRejected',
      details: `${receiver.fullName} declined your collaboration request for "${request.projectTitle}"`,
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Create Notification
    const notif = await CollaborationNotification.create({
      user: request.sender,
      sender: receiverId,
      title: 'Collaboration Request Declined',
      message: `${receiver.fullName} declined your request for "${request.projectTitle}"`,
      type: 'RequestRejected',
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Real-time notify
    sendRealTimeNotification(request.sender, 'COLLABORATION_REQUEST_REJECTED', {
      notification: notif,
      request,
    });

    res.status(200).json({
      status: 'success',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelCollaborationRequest = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { requestId } = req.params;

    const request = await CollaborationRequest.findById(requestId);
    if (!request) {
      return next(new AppError('Collaboration request not found', 404));
    }

    if (request.sender.toString() !== senderId) {
      return next(new AppError('You are not authorized to withdraw this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new AppError('You can only withdraw pending requests', 400));
    }

    request.status = 'Withdrawn';
    await request.save();

    // Log History
    await CollaborationHistory.create({
      user: senderId,
      type: 'RequestWithdrawn',
      details: `Withdrew collaboration request for "${request.projectTitle}"`,
      relatedEntity: request._id,
      onModel: 'CollaborationRequest',
    });

    // Remove notification from receiver
    await CollaborationNotification.deleteMany({
      user: request.receiver,
      relatedEntity: request._id,
    });

    sendRealTimeNotification(request.receiver, 'COLLABORATION_REQUEST_WITHDRAWN', {
      requestId: request._id,
    });

    res.status(200).json({
      status: 'success',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const listCollaborationRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const incoming = await CollaborationRequest.find({ receiver: userId })
      .populate('sender', 'fullName email')
      .sort({ createdAt: -1 });

    const outgoing = await CollaborationRequest.find({ sender: userId })
      .populate('receiver', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        incoming,
        outgoing,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ACTIVE COLLABORATIONS WORKSPACE
// ==========================================

export const getActiveCollaborations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const projects = await Collaboration.find({ members: userId })
      .populate('members', 'fullName email designation institution')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getCollaborationDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const project = await Collaboration.findById(id)
      .populate('members', 'fullName email designation institution profilePhoto')
      .populate('files.uploadedBy', 'fullName')
      .populate('messages.sender', 'fullName profilePhoto');

    if (!project) {
      return next(new AppError('Collaboration project not found', 404));
    }

    // Check authorization
    if (!project.members.some(m => m._id.toString() === userId)) {
      return next(new AppError('You are not a member of this collaboration', 403));
    }

    res.status(200).json({
      status: 'success',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const addCollaborationMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return next(new AppError('Message text is required', 400));
    }

    const project = await Collaboration.findById(id);
    if (!project) {
      return next(new AppError('Collaboration project not found', 404));
    }

    if (!project.members.some(m => m.toString() === userId)) {
      return next(new AppError('You are not a member of this collaboration', 403));
    }

    const newMessage = {
      sender: userId,
      text,
      createdAt: new Date(),
    };

    project.messages.push(newMessage);
    await project.save();

    // Fetch user details for real-time update
    const sender = await User.findById(userId).select('fullName');

    // Notify other members in real-time
    project.members.forEach(memberId => {
      if (memberId.toString() !== userId) {
        sendRealTimeNotification(memberId, 'COLLABORATION_MESSAGE_RECEIVED', {
          projectId: project._id,
          message: {
            ...newMessage,
            sender: {
              _id: userId,
              fullName: sender.fullName,
            },
          },
        });
      }
    });

    res.status(201).json({
      status: 'success',
      data: project.messages[project.messages.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCollaborationFile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { fileName, fileUrl } = req.body;

    // Use uploaded file path if multer was used, otherwise body URL
    const url = req.file ? `/uploads/${req.file.filename}` : fileUrl;
    const name = req.file ? req.file.originalname : fileName;

    if (!url || !name) {
      return next(new AppError('File upload failed: No file information provided', 400));
    }

    const project = await Collaboration.findById(id);
    if (!project) {
      return next(new AppError('Collaboration project not found', 404));
    }

    if (!project.members.some(m => m.toString() === userId)) {
      return next(new AppError('You are not a member of this collaboration', 403));
    }

    const newFile = {
      name,
      url,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    project.files.push(newFile);
    await project.save();

    const sender = await User.findById(userId).select('fullName');

    // Notify other members
    project.members.forEach(memberId => {
      if (memberId.toString() !== userId) {
        sendRealTimeNotification(memberId, 'COLLABORATION_FILE_UPLOADED', {
          projectId: project._id,
          file: {
            ...newFile,
            uploadedBy: {
              _id: userId,
              fullName: sender.fullName,
            },
          },
        });
      }
    });

    res.status(201).json({
      status: 'success',
      data: project.files[project.files.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

export const addCollaborationMeeting = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, date, link, description } = req.body;

    if (!title || !date) {
      return next(new AppError('Meeting title and date are required', 400));
    }

    const project = await Collaboration.findById(id);
    if (!project) {
      return next(new AppError('Collaboration project not found', 404));
    }

    if (!project.members.some(m => m.toString() === userId)) {
      return next(new AppError('You are not a member of this collaboration', 403));
    }

    const newMeeting = {
      title,
      date,
      link,
      description,
    };

    project.meetings.push(newMeeting);
    await project.save();

    const sender = await User.findById(userId).select('fullName');

    // Notify other members
    project.members.forEach(async (memberId) => {
      if (memberId.toString() !== userId) {
        // Create notification
        const notif = await CollaborationNotification.create({
          user: memberId,
          sender: userId,
          title: 'New Meeting Scheduled',
          message: `${sender.fullName} scheduled a meeting "${title}" for project "${project.title}"`,
          type: 'MeetingInvite',
          relatedEntity: project._id,
          onModel: 'Collaboration',
        });

        sendRealTimeNotification(memberId, 'COLLABORATION_MEETING_SCHEDULED', {
          projectId: project._id,
          notification: notif,
          meeting: newMeeting,
        });
      }
    });

    res.status(201).json({
      status: 'success',
      data: project.meetings[project.meetings.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollaborationProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { progress, status } = req.body;

    const project = await Collaboration.findById(id);
    if (!project) {
      return next(new AppError('Collaboration project not found', 404));
    }

    if (!project.members.some(m => m.toString() === userId)) {
      return next(new AppError('You are not a member of this collaboration', 403));
    }

    if (progress !== undefined) {
      project.progress = Math.max(0, Math.min(100, progress));
    }
    if (status) {
      project.status = status;
      if (status === 'Completed') {
        project.progress = 100;
      }
    }

    await project.save();

    const updater = await User.findById(userId).select('fullName');

    // Log History if completed
    if (status === 'Completed') {
      project.members.forEach(async (memberId) => {
        await CollaborationHistory.create({
          user: memberId,
          type: 'ProjectCompleted',
          details: `Completed collaboration project "${project.title}"`,
          relatedEntity: project._id,
          onModel: 'Collaboration',
        });

        // Notify other members
        if (memberId.toString() !== userId) {
          const notif = await CollaborationNotification.create({
            user: memberId,
            sender: userId,
            title: 'Collaboration Project Completed',
            message: `${updater.fullName} marked "${project.title}" as completed`,
            type: 'ProjectCompleted',
            relatedEntity: project._id,
            onModel: 'Collaboration',
          });

          sendRealTimeNotification(memberId, 'COLLABORATION_PROJECT_COMPLETED', {
            projectId: project._id,
            notification: notif,
          });
        }
      });
    }

    // Notify other members of general update
    project.members.forEach(memberId => {
      if (memberId.toString() !== userId) {
        sendRealTimeNotification(memberId, 'COLLABORATION_PROGRESS_UPDATED', {
          projectId: project._id,
          progress: project.progress,
          status: project.status,
        });
      }
    });

    res.status(200).json({
      status: 'success',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. COLLABORATION ANALYTICS
// ==========================================

export const getCollaborationAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Counts
    const totalRequestsSent = await CollaborationRequest.countDocuments({ sender: userId });
    const totalRequestsReceived = await CollaborationRequest.countDocuments({ receiver: userId });
    
    const acceptedRequests = await CollaborationRequest.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'Accepted',
    });

    const rejectedRequests = await CollaborationRequest.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'Rejected',
    });

    const activeProjects = await Collaboration.countDocuments({
      members: userId,
      status: 'Active',
    });

    const completedProjects = await Collaboration.countDocuments({
      members: userId,
      status: 'Completed',
    });

    // Gather partner profiles to extract domains, countries, and institutions
    const collaborations = await Collaboration.find({ members: userId }).populate('members', '_id');
    const partnerIds = new Set();
    collaborations.forEach(collab => {
      collab.members.forEach(member => {
        if (member._id.toString() !== userId) {
          partnerIds.add(member._id.toString());
        }
      });
    });

    const partnerProfiles = await Profile.find({ user: { $in: Array.from(partnerIds) } });

    const domainsMap = {};
    const countriesMap = {};
    const institutionsMap = {};

    partnerProfiles.forEach(prof => {
      if (prof.country) {
        countriesMap[prof.country] = (countriesMap[prof.country] || 0) + 1;
      }
      if (prof.institution) {
        institutionsMap[prof.institution] = (institutionsMap[prof.institution] || 0) + 1;
      }
      // Assuming research interests/domains can be pulled from profile or simple mock values
      if (prof.designation) {
        domainsMap[prof.designation] = (domainsMap[prof.designation] || 0) + 1;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalRequests: totalRequestsSent + totalRequestsReceived,
        acceptedRequests,
        rejectedRequests,
        activeProjects,
        completedProjects,
        topCollaborationDomains: Object.keys(domainsMap).map(d => ({ name: d, count: domainsMap[d] })),
        countriesCollaboratedWith: Object.keys(countriesMap).map(c => ({ name: c, count: countriesMap[c] })),
        institutionsCollaboratedWith: Object.keys(institutionsMap).map(i => ({ name: i, count: institutionsMap[i] })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. SMART AI SUGGESTIONS
// ==========================================

export const getSuggestedCollaborators = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch similarity scores from the database calculated by similarity.service
    const similarities = await ResearcherSimilarity.find({
      $or: [{ researcherA: userId }, { researcherB: userId }],
    })
      .sort({ similarityScore: -1 })
      .limit(15);

    const suggestions = [];

    for (const sim of similarities) {
      const otherUserId = sim.researcherA.toString() === userId ? sim.researcherB : sim.researcherA;

      const otherUser = await User.findById(otherUserId).select('fullName email');
      const otherProfile = await Profile.findOne({ user: otherUserId })
        .select('profilePhoto designation institution country bio publications citations');

      // Check collaboration status of the other user
      const colStatus = await CollaborationStatus.findOne({ user: otherUserId }).select('status');

      if (otherUser && otherProfile) {
        suggestions.push({
          user: otherUser,
          profile: otherProfile,
          collaborationStatus: colStatus?.status || 'Open for Collaboration',
          similarityScore: sim.similarityScore,
          matchLevel: sim.matchLevel,
          breakdown: sim.breakdown,
          commonKeywords: sim.commonKeywords,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};
