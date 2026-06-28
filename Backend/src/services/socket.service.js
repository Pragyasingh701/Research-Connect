import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;
const userSockets = new Map(); // userId -> Set of socketIds (to support multiple tabs)

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id || socket.user._id;
    if (!userId) return;

    // Map user to socket
    if (!userSockets.has(userId.toString())) {
      userSockets.set(userId.toString(), new Set());
    }
    userSockets.get(userId.toString()).add(socket.id);

    // Join user-specific room
    socket.join(userId.toString());
    console.log(`🔌 User connected: ${userId} (Socket ID: ${socket.id}). Total active users: ${userSockets.size}`);

    // Join profile room for real-time count updates
    socket.on('request-follow-count', async ({ targetUserId }) => {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(targetUserId).select('followersCount');
        socket.join(`profile:${targetUserId}`);
        socket.emit('followers-count-updated', {
          userId: targetUserId,
          followersCount: user?.followersCount || 0,
        });
      } catch (err) {
        console.error('Error on request-follow-count:', err.message);
      }
    });

    socket.on('request-following-count', async ({ targetUserId }) => {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(targetUserId).select('followingCount');
        socket.join(`profile:${targetUserId}`);
        socket.emit('following-count-updated', {
          userId: targetUserId,
          followingCount: user?.followingCount || 0,
        });
      } catch (err) {
        console.error('Error on request-following-count:', err.message);
      }
    });

    // Handle follow-user via socket
    socket.on('follow-user', async ({ targetUserId }) => {
      try {
        const followService = await import('./follow.service.js');
        const { followedUser, followerUser, notification } = await followService.followUser(userId, targetUserId);
        
        socket.emit('follow-success', { targetUserId });

        // Broadcast counts
        io.to(`profile:${targetUserId}`).emit('followers-count-updated', {
          userId: targetUserId,
          followersCount: followedUser.followersCount,
        });
        io.to(`profile:${userId}`).emit('following-count-updated', {
          userId,
          followingCount: followerUser.followingCount,
        });

        // Notify target user
        io.to(targetUserId.toString()).emit('researcher-followed', {
          followerId: userId,
          followerName: followerUser.fullName,
        });
        io.to(targetUserId.toString()).emit('notification-created', notification);

        // Broadcast profile update
        io.to(`profile:${targetUserId}`).emit('profile-updated');
        io.to(`profile:${userId}`).emit('profile-updated');
      } catch (err) {
        socket.emit('follow-error', { message: err.message });
      }
    });

    // Handle unfollow-user via socket
    socket.on('unfollow-user', async ({ targetUserId }) => {
      try {
        const followService = await import('./follow.service.js');
        const { followedUser, followerUser } = await followService.unfollowUser(userId, targetUserId);

        socket.emit('unfollow-success', { targetUserId });

        // Broadcast counts
        io.to(`profile:${targetUserId}`).emit('followers-count-updated', {
          userId: targetUserId,
          followersCount: followedUser.followersCount,
        });
        io.to(`profile:${userId}`).emit('following-count-updated', {
          userId,
          followingCount: followerUser.followingCount,
        });

        // Notify target user
        io.to(targetUserId.toString()).emit('researcher-unfollowed', {
          followerId: userId,
        });

        // Broadcast profile update
        io.to(`profile:${targetUserId}`).emit('profile-updated');
        io.to(`profile:${userId}`).emit('profile-updated');
      } catch (err) {
        socket.emit('unfollow-error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      const userIds = userSockets.get(userId.toString());
      if (userIds) {
        userIds.delete(socket.id);
        if (userIds.size === 0) {
          userSockets.delete(userId.toString());
        }
      }
      console.log(`🔌 User disconnected: ${userId} (Socket ID: ${socket.id})`);
    });
  });

  return io;
};

/**
 * Broadcasts follow and following count updates to room-specific clients
 */
export const broadcastFollowUpdate = (followerId, followingId, followersCount, followingCount) => {
  if (io) {
    io.to(`profile:${followingId}`).emit('followers-count-updated', {
      userId: followingId,
      followersCount,
    });
    io.to(`profile:${followerId}`).emit('following-count-updated', {
      userId: followerId,
      followingCount,
    });
    io.to(`profile:${followingId}`).emit('profile-updated');
    io.to(`profile:${followerId}`).emit('profile-updated');
  }
};

/**
 * Sends a real-time event to a specific user.
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} data - Event payload
 */
export const sendRealTimeNotification = (userId, event, data) => {
  if (io && userId) {
    io.to(userId.toString()).emit(event, data);
    return true;
  }
  return false;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
