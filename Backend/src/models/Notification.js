import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification must have a message'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Recommendation', 'Publication', 'Collaboration', 'System', 'Profile', 'Follow'],
      required: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['Publication', 'Profile', 'CollaborationRequest', 'Follow'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Optimizes loading a user's unread notifications in reverse chronological order
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
