import mongoose from 'mongoose';

const followerSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower user is required'],
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following user is required'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need follow time
  }
);

// Compound Index: Unique follower-following relationship
followerSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follower = mongoose.model('Follower', followerSchema);
export default Follower;
