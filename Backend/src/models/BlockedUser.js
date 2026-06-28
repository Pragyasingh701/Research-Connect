import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocker is required'],
      index: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocked user is required'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Ensure unique block record per pair
blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
export default BlockedUser;
