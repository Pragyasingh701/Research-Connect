import mongoose from 'mongoose';

const projectNotificationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Notification must belong to a project'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTask',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for getting unread notifications for a user in a project
projectNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const ProjectNotification = mongoose.model('ProjectNotification', projectNotificationSchema);
export default ProjectNotification;
