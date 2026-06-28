import mongoose from 'mongoose';

const collaborationNotificationSchema = new mongoose.Schema(
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
      enum: [
        'NewRequest',
        'RequestAccepted',
        'RequestRejected',
        'NewConnection',
        'NewFollower',
        'StatusChanged',
        'NewPublication',
        'Mention',
        'MeetingInvite',
        'ProjectCompleted'
      ],
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
      enum: ['CollaborationRequest', 'Collaboration', 'User', 'Publication'],
    },
  },
  {
    timestamps: true,
  }
);

collaborationNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const CollaborationNotification = mongoose.model('CollaborationNotification', collaborationNotificationSchema);
export default CollaborationNotification;
