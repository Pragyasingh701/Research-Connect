import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    followerId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: [true, 'Follower user ID is required'],
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following user ID is required'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only store createdAt
    collection: 'follows',
  }
);

// Compound Unique Index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Index for sorting follows by date
followSchema.index({ createdAt: -1 });

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
