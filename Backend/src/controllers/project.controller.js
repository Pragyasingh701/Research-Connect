import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectTask from '../models/ProjectTask.js';
import ProjectFile from '../models/ProjectFile.js';
import ProjectComment from '../models/ProjectComment.js';
import ProjectActivity from '../models/ProjectActivity.js';
import ProjectPublication from '../models/ProjectPublication.js';
import ProjectFunding from '../models/ProjectFunding.js';
import ProjectNotification from '../models/ProjectNotification.js';
import ProjectAnalytics from '../models/ProjectAnalytics.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Publication from '../models/Publication.js';
import AppError from '../utils/AppError.js';

import File from '../models/File.js';
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  replaceFileInCloudinary
} from '../services/upload.service.js';
import { getIO } from '../services/socket.service.js';
import path from 'path';

// Helper: validate express validator results
const validateExpress = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    throw new AppError(messages, 400);
  }
};

// Helper: log project activity
const logActivity = async (projectId, userId, action, details, metadata = {}) => {
  try {
    await ProjectActivity.create({
      project: projectId,
      user: userId,
      action,
      details,
      metadata,
    });
    await Project.findByIdAndUpdate(projectId, {
      lastUpdated: Date.now(),
      updatedBy: userId,
    });
  } catch (err) {
    console.error('Failed to log project activity:', err.message);
  }
};

// Helper: recalculate project analytics
const recalculateAnalytics = async (projectId) => {
  try {
    const totalTasks = await ProjectTask.countDocuments({ project: projectId });
    const completedTasks = await ProjectTask.countDocuments({ project: projectId, status: 'Completed' });
    const pendingTasks = totalTasks - completedTasks;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const publicationsCount = await ProjectPublication.countDocuments({ project: projectId });

    // Aggregate citations and downloads from linked publications (if mapped to database Publication)
    const linkedPubs = await ProjectPublication.find({ project: projectId, publication: { $exists: true, $ne: null } });
    let citationsCount = 0;
    let downloadsCount = 0;
    
    if (linkedPubs.length > 0) {
      const dbPubIds = linkedPubs.map(lp => lp.publication);
      const dbPubs = await Publication.find({ _id: { $in: dbPubIds } });
      citationsCount = dbPubs.reduce((acc, p) => acc + (p.citationCount || 0), 0);
      // Simulated reads/downloads
      downloadsCount = dbPubs.reduce((acc, p) => acc + (p.downloadsCount || Math.round(Math.random() * 50)), 0);
    }

    const funding = await ProjectFunding.findOne({ project: projectId });
    let fundingUtilization = 0;
    if (funding && funding.budget > 0) {
      fundingUtilization = Math.round((funding.amountReceived / funding.budget) * 100);
    }

    const activityCount = await ProjectActivity.countDocuments({ project: projectId });

    // Team productivity: completed tasks per user
    const tasks = await ProjectTask.find({ project: projectId, status: 'Completed', assignee: { $ne: null } });
    const productivityMap = {};
    for (const t of tasks) {
      const uid = t.assignee.toString();
      productivityMap[uid] = (productivityMap[uid] || 0) + 1;
    }
    const teamProductivity = Object.keys(productivityMap).map(uid => ({
      user: uid,
      completedTasksCount: productivityMap[uid],
    }));

    await ProjectAnalytics.findOneAndUpdate(
      { project: projectId },
      {
        progress,
        completedTasks,
        pendingTasks,
        publicationsCount,
        citationsCount,
        downloadsCount,
        fundingUtilization,
        activityCount,
        teamProductivity,
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to recalculate project analytics:', err.message);
  }
};

// Helper: send notifications
const sendProjectNotification = async (projectId, userId, senderId, type, message, taskId = null) => {
  try {
    const notif = await ProjectNotification.create({
      project: projectId,
      user: userId,
      sender: senderId,
      type,
      message,
      task: taskId,
    });

    // Send real-time notification via Socket.io
    try {
      const io = getIO();
      io.to(userId.toString()).emit('PROJECT_NOTIFICATION', {
        notification: notif,
        projectId,
      });
    } catch (socketErr) {
      // Socket io might not be connected in tests
    }
  } catch (err) {
    console.error('Failed to create project notification:', err.message);
  }
};

/* ==========================================================================
   PROJECT WORKSPACE CRUD
   ========================================================================== */

export const createProject = async (req, res, next) => {
  try {
    validateExpress(req);
    const {
      title,
      shortTitle,
      description,
      researchDomain,
      researchArea,
      keywords,
      objectives,
      expectedOutcomes,
      type,
      status,
      visibility,
      startDate,
      endDate,
      logoUrl,
      bannerUrl,
    } = req.body;

    const project = await Project.create({
      title,
      shortTitle,
      description,
      researchDomain,
      researchArea,
      keywords: Array.isArray(keywords) ? keywords : keywords ? keywords.split(',').map(k => k.trim()) : [],
      objectives: Array.isArray(objectives) ? objectives : objectives ? objectives.split(',').map(o => o.trim()) : [],
      expectedOutcomes,
      type,
      status,
      visibility,
      startDate,
      endDate,
      logoUrl,
      bannerUrl,
      owner: req.user._id,
    });

    // Add owner as a team member
    await ProjectMember.create({
      project: project._id,
      user: req.user._id,
      role: 'Principal Investigator (PI)',
      permission: 'Owner',
      status: 'Active',
      joinedAt: Date.now(),
    });

    // Create empty analytics record
    await ProjectAnalytics.create({
      project: project._id,
      progress: 0,
    });

    // Log Activity
    await logActivity(project._id, req.user._id, 'project_created', 'Project workspace created.');

    res.status(201).json({
      status: 'success',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;

    // Permissions check: user must be Owner or Admin
    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || (member.permission !== 'Owner' && member.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to edit this project settings', 403));
    }

    const {
      title,
      shortTitle,
      description,
      researchDomain,
      researchArea,
      keywords,
      objectives,
      expectedOutcomes,
      type,
      status,
      visibility,
      startDate,
      endDate,
      logoUrl,
      bannerUrl,
    } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        shortTitle,
        description,
        researchDomain,
        researchArea,
        keywords: Array.isArray(keywords) ? keywords : keywords ? keywords.split(',').map(k => k.trim()) : undefined,
        objectives: Array.isArray(objectives) ? objectives : objectives ? objectives.split(',').map(o => o.trim()) : undefined,
        expectedOutcomes,
        type,
        status,
        visibility,
        startDate,
        endDate,
        logoUrl,
        bannerUrl,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return next(new AppError('Project not found', 404));
    }

    await logActivity(id, req.user._id, 'project_updated', 'Project settings updated.');

    res.status(200).json({
      status: 'success',
      data: updatedProject,
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).populate('owner', 'fullName email profilePhoto');
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Membership check for private/invite-only visibility
    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (project.visibility !== 'Public' && !member) {
      return next(new AppError('This project is private and you are not a member', 403));
    }

    // Gather members, funding, tasks, files, analytics
    const members = await ProjectMember.find({ project: id }).populate('user', 'fullName email profilePhoto designation institution');
    const funding = await ProjectFunding.findOne({ project: id });
    const tasks = await ProjectTask.find({ project: id }).populate('assignee', 'fullName profilePhoto');
    const files = await ProjectFile.find({ project: id }).populate('uploadedBy', 'fullName');
    const publications = await ProjectPublication.find({ project: id });
    const analytics = await ProjectAnalytics.findOne({ project: id });

    res.status(200).json({
      status: 'success',
      data: {
        project,
        membership: member || null,
        members,
        funding,
        tasks,
        files,
        publications,
        analytics,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission !== 'Owner') {
      return next(new AppError('Only the Project Owner can delete this project workspace', 403));
    }

    // Automatic cleanup of associated files from Cloudinary and files collections
    try {
      // Clean up general files collection
      const filesToClean = await File.find({ projectId: id });
      for (const file of filesToClean) {
        await deleteFileFromCloudinary(file.publicId);
      }

      // Clean up ProjectFile files and all historical versions
      const projectFilesToClean = await ProjectFile.find({ project: id });
      for (const file of projectFilesToClean) {
        await deleteFileFromCloudinary(file.publicId);
        for (const ver of file.versions || []) {
          await deleteFileFromCloudinary(ver.publicId);
        }
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up project files on delete:', cleanupErr);
    }

    // Cascade delete related records
    await Project.findByIdAndDelete(id);
    await ProjectMember.deleteMany({ project: id });
    await ProjectTask.deleteMany({ project: id });
    await ProjectFile.deleteMany({ project: id });
    await ProjectComment.deleteMany({ project: id });
    await ProjectActivity.deleteMany({ project: id });
    await ProjectPublication.deleteMany({ project: id });
    await ProjectFunding.deleteMany({ project: id });
    await ProjectNotification.deleteMany({ project: id });
    await ProjectAnalytics.deleteMany({ project: id });

    res.status(200).json({
      status: 'success',
      message: 'Project and all associated data deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const archiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || (member.permission !== 'Owner' && member.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to archive this project', 403));
    }

    const project = await Project.findByIdAndUpdate(id, { status: 'Archived' }, { new: true });
    await logActivity(id, req.user._id, 'project_archived', 'Project archived.');

    res.status(200).json({
      status: 'success',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

export const listProjects = async (req, res, next) => {
  try {
    const { search, domain, status, type, sortBy } = req.query;

    // Find projects matching search details and visibility constraints
    const filter = {};

    // Users can see:
    // 1. Any 'Public' project
    // 2. Any project they are a member of
    const myMemberships = await ProjectMember.find({ user: req.user._id }).select('project');
    const myProjectIds = myMemberships.map((m) => m.project);

    filter.$or = [
      { visibility: 'Public' },
      { _id: { $in: myProjectIds } },
    ];

    if (search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { shortTitle: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { keywords: { $in: [new RegExp(search, 'i')] } },
          ],
        },
      ];
    }

    if (domain && domain !== 'all') {
      filter.researchDomain = domain;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }

    let sortQuery = { createdAt: -1 };
    if (sortBy === 'newest') {
      sortQuery = { createdAt: -1 };
    } else if (sortBy === 'recently_updated') {
      sortQuery = { lastUpdated: -1 };
    } else if (sortBy === 'title') {
      sortQuery = { title: 1 };
    }

    const projects = await Project.find(filter)
      .populate('owner', 'fullName profilePhoto')
      .sort(sortQuery);

    // Populate members list count and progress for dashboard
    const projectsWithDetails = await Promise.all(
      projects.map(async (p) => {
        const teamCount = await ProjectMember.countDocuments({ project: p._id, status: 'Active' });
        const analytics = await ProjectAnalytics.findOne({ project: p._id });
        const funding = await ProjectFunding.findOne({ project: p._id });

        return {
          ...p.toObject(),
          teamCount,
          progress: analytics ? analytics.progress : 0,
          budget: funding ? funding.budget : 0,
        };
      })
    );

    // If sorting by most funded or most active
    if (sortBy === 'most_funded') {
      projectsWithDetails.sort((a, b) => b.budget - a.budget);
    } else if (sortBy === 'most_active') {
      projectsWithDetails.sort((a, b) => b.teamCount - a.teamCount);
    }

    res.status(200).json({
      status: 'success',
      results: projectsWithDetails.length,
      data: projectsWithDetails,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT TEAM MANAGEMENT
   ========================================================================== */

export const inviteMember = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;
    const { email, role, permission } = req.body;

    const senderMember = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!senderMember || (senderMember.permission !== 'Owner' && senderMember.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to invite members', 403));
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return next(new AppError('No researcher found with this email address', 404));
    }

    // Check if membership already exists
    const existing = await ProjectMember.findOne({ project: id, user: targetUser._id });
    if (existing) {
      return next(new AppError('This user is already a member or has a pending invitation', 400));
    }

    const newMember = await ProjectMember.create({
      project: id,
      user: targetUser._id,
      role,
      permission,
      status: 'Pending',
      invitedBy: req.user._id,
    });

    const project = await Project.findById(id);

    // Send Project Notification
    await sendProjectNotification(
      id,
      targetUser._id,
      req.user._id,
      'invited',
      `You have been invited to join the project "${project.title}" as a ${role}.`
    );

    await logActivity(id, req.user._id, 'member_invited', `Invited ${targetUser.fullName} to the team.`);

    res.status(201).json({
      status: 'success',
      data: newMember,
    });
  } catch (err) {
    next(err);
  }
};

export const respondToInvite = async (req, res, next) => {
  try {
    const { id } = req.params; // project ID
    const { action } = req.body; // 'Accept' or 'Decline'

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member) {
      return next(new AppError('No invitation found for this project', 404));
    }

    if (member.status !== 'Pending') {
      return next(new AppError('This invitation has already been processed', 400));
    }

    if (action === 'Accept') {
      member.status = 'Active';
      member.joinedAt = Date.now();
      await member.save();

      await logActivity(id, req.user._id, 'member_joined', `Joined the project team.`);
      await recalculateAnalytics(id);
    } else {
      await ProjectMember.findByIdAndDelete(member._id);
    }

    res.status(200).json({
      status: 'success',
      message: `Invitation successfully ${action === 'Accept' ? 'accepted' : 'declined'}`,
    });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const senderMember = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!senderMember || (senderMember.permission !== 'Owner' && senderMember.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to remove team members', 403));
    }

    const targetMember = await ProjectMember.findOne({ project: id, user: userId });
    if (!targetMember) {
      return next(new AppError('Member not found in this project', 404));
    }

    if (targetMember.permission === 'Owner') {
      return next(new AppError('The project owner cannot be removed from the team', 400));
    }

    await ProjectMember.findByIdAndDelete(targetMember._id);

    const removedUser = await User.findById(userId);
    await logActivity(id, req.user._id, 'member_removed', `Removed ${removedUser?.fullName || 'a member'} from the team.`);
    await recalculateAnalytics(id);

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id, userId } = req.params;
    const { role, permission } = req.body;

    const senderMember = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!senderMember || (senderMember.permission !== 'Owner' && senderMember.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to modify member roles', 403));
    }

    const targetMember = await ProjectMember.findOne({ project: id, user: userId });
    if (!targetMember) {
      return next(new AppError('Member not found in this project', 404));
    }

    if (targetMember.permission === 'Owner' && permission !== 'Owner') {
      return next(new AppError('Owner role cannot be changed. Transfer ownership instead', 400));
    }

    targetMember.role = role || targetMember.role;
    targetMember.permission = permission || targetMember.permission;
    await targetMember.save();

    const targetUser = await User.findById(userId);
    await logActivity(id, req.user._id, 'role_updated', `Updated role of ${targetUser?.fullName} to ${role}.`);

    res.status(200).json({
      status: 'success',
      data: targetMember,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT TASK KANBAN
   ========================================================================== */

export const createTask = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;
    const { title, description, priority, assignee, deadline, labels } = req.body;

    // Check membership
    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have editor access in this project workspace', 403));
    }

    const task = await ProjectTask.create({
      project: id,
      title,
      description,
      priority,
      assignee: assignee || null,
      deadline,
      labels: Array.isArray(labels) ? labels : labels ? labels.split(',').map(l => l.trim()) : [],
      createdBy: req.user._id,
    });

    await logActivity(id, req.user._id, 'task_created', `Created task: "${title}"`);
    await recalculateAnalytics(id);

    if (assignee) {
      const assigneeUser = await User.findById(assignee);
      await sendProjectNotification(
        id,
        assignee,
        req.user._id,
        'assigned',
        `You have been assigned to task: "${title}".`,
        task._id
      );
    }

    res.status(201).json({
      status: 'success',
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id, taskId } = req.params;
    const { title, description, priority, assignee, deadline, labels, checklist } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have editor access in this project workspace', 403));
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const oldAssignee = task.assignee?.toString();

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.assignee = assignee !== undefined ? (assignee || null) : task.assignee;
    task.deadline = deadline !== undefined ? deadline : task.deadline;
    task.labels = labels !== undefined ? (Array.isArray(labels) ? labels : labels.split(',').map(l => l.trim())) : task.labels;
    task.checklist = checklist !== undefined ? checklist : task.checklist;

    await task.save();

    await logActivity(id, req.user._id, 'task_updated', `Updated task: "${task.title}"`);
    await recalculateAnalytics(id);

    // Notify new assignee if changed
    if (assignee && assignee.toString() !== oldAssignee) {
      await sendProjectNotification(
        id,
        assignee,
        req.user._id,
        'assigned',
        `You have been assigned to task: "${task.title}".`,
        task._id
      );
    }

    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have editor access in this project workspace', 403));
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    await ProjectTask.findByIdAndDelete(taskId);

    await logActivity(id, req.user._id, 'task_deleted', `Deleted task: "${task.title}"`);
    await recalculateAnalytics(id);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const changeTaskStatus = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { status } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have editor access in this project workspace', 403));
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await logActivity(id, req.user._id, 'task_status_changed', `Moved task "${task.title}" from ${oldStatus} to ${status}`);
    await recalculateAnalytics(id);

    // Real-time socket broadcast
    try {
      const io = getIO();
      io.to(`project:${id}`).emit('TASK_STATUS_CHANGED', {
        taskId,
        status,
        userId: req.user._id,
      });
    } catch (socketErr) {}

    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT FILES OPERATIONS
   ========================================================================== */

export const uploadProjectFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have permission to upload files', 403));
    }

    if (!req.file) {
      return next(new AppError('Please provide a file to upload', 400));
    }

    // Determine upload type based on file extension
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let uploadType = 'project-file';
    if (/png|jpg|jpeg|gif|webp/i.test(ext)) {
      uploadType = 'project-image';
    } else if (/csv|xlsx|xls|json|xml|h5|npy/i.test(ext)) {
      uploadType = 'project-dataset';
    }

    // Call Centralized Cloudinary storage service
    const fileRecord = await uploadFileToCloudinary(
      req.file,
      uploadType,
      { projectId: id },
      req.user._id
    );

    // Determine type label for ProjectFile
    let fileType = 'Unknown';
    if (/pdf/i.test(ext)) fileType = 'PDF';
    else if (/docx|doc/i.test(ext)) fileType = 'DOCX';
    else if (/pptx|ppt/i.test(ext)) fileType = 'PPTX';
    else if (/png|jpg|jpeg|gif|webp/i.test(ext)) fileType = 'Image';
    else if (/csv/i.test(ext)) fileType = 'CSV';
    else if (/xlsx|xls/i.test(ext)) fileType = 'XLSX';
    else if (/zip|tar|gz/i.test(ext)) fileType = 'ZIP';
    else if (/py|js|ts|cpp|java|go|rs|r/i.test(ext)) fileType = 'Source Code';

    const newFile = await ProjectFile.create({
      project: id,
      name: req.file.originalname,
      folder: folder || '/',
      url: fileRecord.secureUrl,
      publicId: fileRecord.publicId,
      size: req.file.size,
      type: fileType,
      uploadedBy: req.user._id,
    });

    await logActivity(id, req.user._id, 'file_uploaded', `Uploaded file: "${req.file.originalname}"`);
    await recalculateAnalytics(id);

    res.status(201).json({
      status: 'success',
      data: newFile,
    });
  } catch (err) {
    next(err);
  }
};

export const replaceProjectFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have permission to upload files', 403));
    }

    const projectFile = await ProjectFile.findById(fileId);
    if (!projectFile) {
      return next(new AppError('File not found', 404));
    }

    if (!req.file) {
      return next(new AppError('Please provide a file to replace', 400));
    }

    // Determine upload type based on file extension
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let uploadType = 'project-file';
    if (/png|jpg|jpeg|gif|webp/i.test(ext)) {
      uploadType = 'project-image';
    } else if (/csv|xlsx|xls|json|xml|h5|npy/i.test(ext)) {
      uploadType = 'project-dataset';
    }

    // Replace and upload new file
    const fileRecord = await replaceFileInCloudinary(
      projectFile.publicId,
      req.file,
      uploadType,
      { projectId: id },
      req.user._id
    );

    // Push current details to versions array
    projectFile.versions.push({
      url: projectFile.url,
      publicId: projectFile.publicId,
      versionNum: projectFile.currentVersion,
      uploadedBy: projectFile.uploadedBy,
      uploadedAt: projectFile.updatedAt,
    });

    // Update with new file details
    projectFile.url = fileRecord.secureUrl;
    projectFile.publicId = fileRecord.publicId;
    projectFile.size = req.file.size;
    projectFile.currentVersion += 1;
    projectFile.uploadedBy = req.user._id;

    await projectFile.save();

    await logActivity(id, req.user._id, 'file_replaced', `Uploaded new version (v${projectFile.currentVersion}) for "${projectFile.name}"`);

    res.status(200).json({
      status: 'success',
      data: projectFile,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProjectFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have permission to delete files', 403));
    }

    const projectFile = await ProjectFile.findById(fileId);
    if (!projectFile) {
      return next(new AppError('File not found', 404));
    }

    // Delete current version from storage
    await deleteFile(projectFile.publicId);

    // Delete all older versions from storage
    for (const ver of projectFile.versions) {
      await deleteFile(ver.publicId);
    }

    await ProjectFile.findByIdAndDelete(fileId);

    await logActivity(id, req.user._id, 'file_deleted', `Deleted file: "${projectFile.name}"`);
    await recalculateAnalytics(id);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getFileVersions = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await ProjectFile.findById(fileId).populate('versions.uploadedBy', 'fullName');
    if (!file) {
      return next(new AppError('File not found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: file.versions,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT PUBLICATIONS
   ========================================================================== */

export const linkPublication = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;
    const { title, status, authors, doi, url, publicationId } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have permission to modify publications', 403));
    }

    const linkedPub = await ProjectPublication.create({
      project: id,
      publication: publicationId || null,
      title,
      status,
      authors: Array.isArray(authors) ? authors : authors ? authors.split(',').map(a => a.trim()) : [],
      doi,
      url,
      linkedBy: req.user._id,
    });

    await logActivity(id, req.user._id, 'publication_linked', `Linked publication: "${title}"`);
    await recalculateAnalytics(id);

    res.status(201).json({
      status: 'success',
      data: linkedPub,
    });
  } catch (err) {
    next(err);
  }
};

export const unlinkPublication = async (req, res, next) => {
  try {
    const { id, publicationId } = req.params;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || member.permission === 'Viewer') {
      return next(new AppError('You do not have permission to modify publications', 403));
    }

    const linkedPub = await ProjectPublication.findById(publicationId);
    if (!linkedPub) {
      return next(new AppError('Linked publication not found', 404));
    }

    await ProjectPublication.findByIdAndDelete(publicationId);

    await logActivity(id, req.user._id, 'publication_unlinked', `Unlinked publication: "${linkedPub.title}"`);
    await recalculateAnalytics(id);

    res.status(200).json({
      status: 'success',
      message: 'Publication unlinked successfully',
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT FUNDING DETAILS
   ========================================================================== */

export const updateProjectFunding = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;
    const { agency, grantNumber, budget, currency, amountReceived, sponsor, proposalStatus } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member || (member.permission !== 'Owner' && member.permission !== 'Admin')) {
      return next(new AppError('You do not have permission to modify funding details', 403));
    }

    const funding = await ProjectFunding.findOneAndUpdate(
      { project: id },
      {
        agency,
        grantNumber,
        budget,
        currency,
        amountReceived,
        sponsor,
        proposalStatus,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity(id, req.user._id, 'funding_updated', `Updated funding budget tracker.`);
    await recalculateAnalytics(id);

    res.status(200).json({
      status: 'success',
      data: funding,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   COLLABORATION & REAL-TIME DISCUSSIONS
   ========================================================================== */

export const getProjectComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { taskId } = req.query;

    const query = { project: id };
    if (taskId) {
      query.task = taskId;
    } else {
      query.task = null; // Main project board discussion
    }

    const comments = await ProjectComment.find(query)
      .populate('author', 'fullName profilePhoto')
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req, res, next) => {
  try {
    validateExpress(req);
    const { id } = req.params;
    const { content, taskId, attachments } = req.body;

    const member = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (!member) {
      return next(new AppError('You are not a member of this project', 403));
    }

    const comment = await ProjectComment.create({
      project: id,
      task: taskId || null,
      author: req.user._id,
      content,
      attachments,
    });

    const populatedComment = await ProjectComment.findById(comment._id).populate('author', 'fullName profilePhoto');

    // Emit real-time comment event to room
    try {
      const io = getIO();
      io.to(`project:${id}`).emit('NEW_PROJECT_COMMENT', {
        comment: populatedComment,
        taskId: taskId || null,
      });
    } catch (socketErr) {}

    res.status(201).json({
      status: 'success',
      data: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   PROJECT ANALYTICS ENGINE
   ========================================================================== */

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const analytics = await ProjectAnalytics.findOne({ project: id }).populate('teamProductivity.user', 'fullName profilePhoto');
    const tasks = await ProjectTask.find({ project: id });
    const activities = await ProjectActivity.find({ project: id })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate status distribution
    const statusCounts = { Todo: 0, 'In Progress': 0, Review: 0, Completed: 0 };
    // Calculate priority distribution
    const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };

    tasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: analytics,
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        activities,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
   AI ASSISTANT ENGINE (SMART RECOMMENDATIONS)
   ========================================================================== */

export const getAiSuggestions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Get current members to exclude them from suggestions
    const currentMembers = await ProjectMember.find({ project: id }).select('user');
    const memberIds = currentMembers.map((m) => m.user.toString());

    // 1. AI Suggested Collaborators based on matching skills, keywords or domain
    // We query researcher profiles which match keywords or research domain
    const candidateProfiles = await Profile.find({
      user: { $nin: memberIds },
    }).populate('user', 'fullName email profilePhoto');

    const suggestedCollaborators = candidateProfiles
      .map((p) => {
        let matchScore = 15; // baseline match score
        
        // Match research interest domain
        if (p.researchInterest && p.researchInterest.toLowerCase().includes(project.researchDomain.toLowerCase())) {
          matchScore += 35;
        }

        // Match keywords
        const commonKeywords = p.skills?.filter((s) =>
          project.keywords.some((k) => k.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(k.toLowerCase()))
        ) || [];
        matchScore += commonKeywords.length * 15;

        return {
          profile: p,
          matchScore: Math.min(matchScore, 98),
          reason: commonKeywords.length > 0 
            ? `Matches skills: ${commonKeywords.slice(0, 3).join(', ')}`
            : `Shares similar domain: ${project.researchDomain}`,
        };
      })
      .filter((rec) => rec.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);

    // 2. Missing Keywords: Heuristic suggestions based on description and domain
    const words = project.description.toLowerCase().split(/\s+/);
    const kwSuggestions = ['machine learning', 'data analysis', 'deep learning', 'collaborative model', 'neural networks', 'predictive model', 'statistical test', 'peer review'];
    const missingKeywords = kwSuggestions.filter((kw) => {
      // If it exists in description but not in project's keywords
      const inDesc = words.some(w => kw.includes(w) && w.length > 4);
      const alreadyAdded = project.keywords.some(k => k.toLowerCase() === kw);
      return inDesc && !alreadyAdded;
    }).slice(0, 3);

    // 3. Recommended Journals & Conferences based on researchDomain
    const domain = project.researchDomain.toLowerCase();
    let recommendedJournals = ['Nature Portfolio', 'Science Advances', 'PLOS ONE'];
    let recommendedConferences = ['Global Research Summit', 'IEEE Annual Meeting'];

    if (domain.includes('computer') || domain.includes('intelligence') || domain.includes('data')) {
      recommendedJournals = ['Nature Machine Intelligence', 'IEEE Transactions on Pattern Analysis', 'Journal of Machine Learning Research'];
      recommendedConferences = ['NeurIPS', 'ICML', 'CVPR', 'KDD'];
    } else if (domain.includes('bio') || domain.includes('medicine') || domain.includes('health')) {
      recommendedJournals = ['The Lancet', 'New England Journal of Medicine', 'Bioinformatics'];
      recommendedConferences = ['ISMB', 'ASCO Annual Meeting', 'EMBS'];
    } else if (domain.includes('social') || domain.includes('education')) {
      recommendedJournals = ['Social Science Research', 'American Educational Research Journal', 'Human Communication Research'];
      recommendedConferences = ['AERA', 'ICA Annual Conference', 'ASA Annual Meeting'];
    }

    // 4. Related Publications
    const relatedPublications = await Publication.find({
      $or: [
        { tags: { $in: project.keywords } },
        { abstract: { $regex: project.keywords[0] || project.researchDomain, $options: 'i' } }
      ],
    }).limit(3);

    // 5. Funding Opportunities
    const fundingOpportunities = [
      { agency: 'National Science Foundation (NSF)', grant: 'NSF Research Core Program', deadline: 'October 15, 2026', amount: '$450,000' },
      { agency: 'European Research Council (ERC)', grant: 'ERC Starting Grant', deadline: 'September 22, 2026', amount: '€1,500,000' },
      { agency: 'National Institutes of Health (NIH)', grant: 'NIH R01 Research Project Grant', deadline: 'November 05, 2026', amount: '$2,500,000' }
    ].slice(0, 2);

    // 6. Risk Analysis
    const totalTasks = await ProjectTask.countDocuments({ project: id });
    const completedTasks = await ProjectTask.countDocuments({ project: id, status: 'Completed' });
    const membersCount = await ProjectMember.countDocuments({ project: id, status: 'Active' });
    
    const risks = [];
    if (membersCount < 2 && project.type === 'Team') {
      risks.push({ level: 'High', factor: 'Collaboration Risk', detail: 'This project is set as a Team project but only has 1 active team member. Invite collaborators to reduce research overload.' });
    }
    if (totalTasks > 0 && (completedTasks / totalTasks) < 0.2 && new Date(project.endDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) {
      risks.push({ level: 'Critical', factor: 'Timeline Delay', detail: 'The project is scheduled to end soon, but less than 20% of tasks are completed. Consider adjusting milestones.' });
    }
    if (risks.length === 0) {
      risks.push({ level: 'Low', factor: 'Execution Health', detail: 'Project is running smoothly with adequate team capacity and progress milestones.' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        suggestedCollaborators,
        missingKeywords,
        journals: recommendedJournals,
        conferences: recommendedConferences,
        relatedPublications,
        fundingOpportunities,
        risks,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const followProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return next(new AppError('Project not found', 404));

    const alreadyFollowing = project.followers.includes(req.user._id);
    if (alreadyFollowing) {
      return next(new AppError('You are already following this project', 400));
    }

    project.followers.push(req.user._id);
    project.followersCount = project.followers.length;
    await project.save();

    await logActivity(id, req.user._id, 'project_followed', 'Followed the project.');

    res.status(200).json({
      status: 'success',
      message: 'Successfully followed project',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

export const unfollowProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return next(new AppError('Project not found', 404));

    const index = project.followers.indexOf(req.user._id);
    if (index === -1) {
      return next(new AppError('You are not following this project', 400));
    }

    project.followers.splice(index, 1);
    project.followersCount = project.followers.length;
    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully unfollowed project',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

export const joinProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const project = await Project.findById(id);
    if (!project) return next(new AppError('Project not found', 404));

    const existing = await ProjectMember.findOne({ project: id, user: req.user._id });
    if (existing) {
      return next(new AppError('You have already requested to join or are a member', 400));
    }

    const request = await ProjectMember.create({
      project: id,
      user: req.user._id,
      role: role || 'External Collaborator',
      permission: 'Viewer',
      status: 'Pending',
    });

    // Notify project owner
    await sendProjectNotification(
      id,
      project.owner,
      req.user._id,
      'join_request',
      `${req.user.fullName} requested to join the project team as a ${role || 'External Collaborator'}.`
    );

    res.status(201).json({
      status: 'success',
      message: 'Join request sent successfully',
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

