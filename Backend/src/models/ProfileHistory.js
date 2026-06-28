import mongoose from 'mongoose';

const profileHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'History must belong to a user'],
      index: true,
    },
    version: {
      type: Number,
      required: [true, 'History must have a version number'],
    },
    changeSummary: {
      type: String,
      default: 'Manual Edit',
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'History snapshot payload is required'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for fast lookup of a user's revision history in order
profileHistorySchema.index({ user: 1, version: -1 });

const ProfileHistory = mongoose.model('ProfileHistory', profileHistorySchema);
export default ProfileHistory;
