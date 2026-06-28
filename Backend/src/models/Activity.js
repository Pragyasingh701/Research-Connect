import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must belong to a user'],
      index: true,
    },
    type: {
      type: String,
      enum: ['follow', 'publication', 'collaboration'],
      required: [true, 'Activity type is required'],
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['Follow', 'Publication', 'CollaborationRequest'],
    },
    activityText: {
      type: String,
      required: [true, 'Activity text is required'],
      trim: true,
    },
    privacy: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need record time
  }
);

// Index for getting recent activities
activitySchema.index({ createdAt: -1 });

// Compound index for user feed queries
activitySchema.index({ user: 1, privacy: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
