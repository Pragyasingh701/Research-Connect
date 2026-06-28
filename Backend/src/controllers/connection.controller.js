import ResearcherConnection from '../models/ResearcherConnection.js';
import BlockedUser from '../models/BlockedUser.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ResearcherSimilarity from '../models/ResearcherSimilarity.js';
import CollaborationNotification from '../models/CollaborationNotification.js';
import AppError from '../utils/AppError.js';
import { sendRealTimeNotification } from '../services/socket.service.js';
import { sendNewConnectionEmail } from '../services/email.service.js';

export const connectUser = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const { receiverId } = req.params;

    if (requesterId === receiverId) {
      return next(new AppError('You cannot connect with yourself', 400));
    }

    // Check if blocked
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { blocker: requesterId, blocked: receiverId },
        { blocker: receiverId, blocked: requesterId },
      ],
    });

    if (isBlocked) {
      return next(new AppError('Connection blocked', 403));
    }

    // Check existing connection
    const existing = await ResearcherConnection.findOne({
      $or: [
        { requester: requesterId, receiver: receiverId },
        { requester: receiverId, receiver: requesterId },
      ],
    });

    if (existing) {
      return next(new AppError(`A connection relationship already exists (Status: ${existing.status})`, 400));
    }

    const connection = await ResearcherConnection.create({
      requester: requesterId,
      receiver: receiverId,
      status: 'Pending',
    });

    const requester = await User.findById(requesterId);
    const receiver = await User.findById(receiverId);

    // Create Notification
    const notif = await CollaborationNotification.create({
      user: receiverId,
      sender: requesterId,
      title: 'New Connection Request',
      message: `${requester.fullName} sent you a connection request`,
      type: 'NewConnection',
      relatedEntity: connection._id,
      onModel: 'User', // Refers to the requester User
    });

    // Real-time
    sendRealTimeNotification(receiverId, 'NEW_CONNECTION_REQUEST', {
      notification: notif,
      connection,
    });

    // Send Email
    if (receiver) {
      await sendNewConnectionEmail(receiver.email, requester.fullName);
    }

    res.status(201).json({
      status: 'success',
      data: connection,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptConnection = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const { connectionId } = req.params;

    const connection = await ResearcherConnection.findById(connectionId);
    if (!connection) {
      return next(new AppError('Connection request not found', 404));
    }

    if (connection.receiver.toString() !== receiverId) {
      return next(new AppError('You are not authorized to accept this connection request', 403));
    }

    if (connection.status !== 'Pending') {
      return next(new AppError('Connection is not pending', 400));
    }

    connection.status = 'Connected';
    await connection.save();

    const receiver = await User.findById(receiverId);

    // Create Notification to the sender
    const notif = await CollaborationNotification.create({
      user: connection.requester,
      sender: receiverId,
      title: 'Connection Request Accepted',
      message: `${receiver.fullName} accepted your connection request`,
      type: 'NewConnection',
      relatedEntity: connection._id,
      onModel: 'User',
    });

    // Real-time
    sendRealTimeNotification(connection.requester, 'CONNECTION_REQUEST_ACCEPTED', {
      notification: notif,
      connection,
    });

    res.status(200).json({
      status: 'success',
      data: connection,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectConnection = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const { connectionId } = req.params;

    const connection = await ResearcherConnection.findById(connectionId);
    if (!connection) {
      return next(new AppError('Connection request not found', 404));
    }

    if (connection.receiver.toString() !== receiverId) {
      return next(new AppError('You are not authorized to reject this connection request', 403));
    }

    await ResearcherConnection.findByIdAndDelete(connectionId);

    // Delete related notification
    await CollaborationNotification.deleteMany({
      user: receiverId,
      relatedEntity: connectionId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Connection request declined and removed',
    });
  } catch (error) {
    next(error);
  }
};

export const removeConnection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    const connection = await ResearcherConnection.findOneAndDelete({
      $or: [
        { requester: userId, receiver: partnerId, status: 'Connected' },
        { requester: partnerId, receiver: userId, status: 'Connected' },
      ],
    });

    if (!connection) {
      return next(new AppError('Active connection not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Connection removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.params;

    if (blockerId === userId) {
      return next(new AppError('You cannot block yourself', 400));
    }

    const block = await BlockedUser.findOneAndUpdate(
      { blocker: blockerId, blocked: userId },
      { blocker: blockerId, blocked: userId },
      { new: true, upsert: true }
    );

    // Break any existing connection
    await ResearcherConnection.deleteMany({
      $or: [
        { requester: blockerId, receiver: userId },
        { requester: userId, receiver: blockerId },
      ],
    });

    res.status(200).json({
      status: 'success',
      data: block,
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.params;

    await BlockedUser.findOneAndDelete({ blocker: blockerId, blocked: userId });

    res.status(200).json({
      status: 'success',
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reportUser = async (req, res, next) => {
  try {
    const reportedById = req.user.id;
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return next(new AppError('Reason is required to file a report', 400));
    }

    const report = await Report.create({
      reportedBy: reportedById,
      targetId: userId,
      reportType: 'User',
      reason,
    });

    res.status(201).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const listConnections = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch active connections
    const activeConnections = await ResearcherConnection.find({
      $or: [
        { requester: userId, status: 'Connected' },
        { receiver: userId, status: 'Connected' },
      ],
    });

    const activeList = [];
    for (const conn of activeConnections) {
      const partnerId = conn.requester.toString() === userId ? conn.receiver : conn.requester;
      const user = await User.findById(partnerId).select('fullName email');
      const profile = await Profile.findOne({ user: partnerId })
        .select('profilePhoto designation institution country bio publications citations');
      const sim = await ResearcherSimilarity.findOne({
        $or: [
          { researcherA: userId, researcherB: partnerId },
          { researcherA: partnerId, researcherB: userId },
        ],
      });

      if (user && profile) {
        activeList.push({
          connectionId: conn._id,
          user,
          profile,
          similarityScore: sim?.similarityScore || 0,
        });
      }
    }

    // 2. Pending Received
    const pendingReceived = await ResearcherConnection.find({ receiver: userId, status: 'Pending' })
      .populate('requester', 'fullName email');
    const receivedList = [];
    for (const conn of pendingReceived) {
      const profile = await Profile.findOne({ user: conn.requester._id })
        .select('profilePhoto designation institution country');
      receivedList.push({
        connectionId: conn._id,
        user: conn.requester,
        profile,
      });
    }

    // 3. Pending Sent
    const pendingSent = await ResearcherConnection.find({ requester: userId, status: 'Pending' })
      .populate('receiver', 'fullName email');
    const sentList = [];
    for (const conn of pendingSent) {
      const profile = await Profile.findOne({ user: conn.receiver._id })
        .select('profilePhoto designation institution country');
      sentList.push({
        connectionId: conn._id,
        user: conn.receiver,
        profile,
      });
    }

    // 4. Suggested Connections
    const similarities = await ResearcherSimilarity.find({
      $or: [{ researcherA: userId }, { researcherB: userId }],
      similarityScore: { $gte: 30 },
    })
      .sort({ similarityScore: -1 })
      .limit(10);

    // Filter out existing connections or blocks
    const existingConnUserIds = new Set();
    activeConnections.forEach(c => {
      existingConnUserIds.add(c.requester.toString());
      existingConnUserIds.add(c.receiver.toString());
    });
    pendingReceived.forEach(c => existingConnUserIds.add(c.requester.toString()));
    pendingSent.forEach(c => existingConnUserIds.add(c.receiver.toString()));
    existingConnUserIds.add(userId);

    const blocks = await BlockedUser.find({ blocker: userId });
    blocks.forEach(b => existingConnUserIds.add(b.blocked.toString()));

    const suggestedList = [];
    for (const sim of similarities) {
      const partnerId = sim.researcherA.toString() === userId ? sim.researcherB : sim.researcherA;
      if (existingConnUserIds.has(partnerId.toString())) continue;

      const user = await User.findById(partnerId).select('fullName email');
      const profile = await Profile.findOne({ user: partnerId })
        .select('profilePhoto designation institution country bio publications citations');

      if (user && profile) {
        suggestedList.push({
          user,
          profile,
          similarityScore: sim.similarityScore,
          matchLevel: sim.matchLevel,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        active: activeList,
        pendingReceived: receivedList,
        pendingSent: sentList,
        suggested: suggestedList,
      },
    });
  } catch (error) {
    next(error);
  }
};
