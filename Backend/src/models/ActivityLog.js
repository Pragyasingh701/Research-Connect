import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity log must belong to a user'],
      index: true,
    },
    activity: {
      type: String,
      required: [true, 'Activity details are required'],
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    browser: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need record time
  }
);

// Compound Index: Optimizes fetching a user's security audit history
activityLogSchema.index({ user: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
