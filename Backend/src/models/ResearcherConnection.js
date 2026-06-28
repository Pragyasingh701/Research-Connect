import mongoose from 'mongoose';

const researcherConnectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Connected'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a single connection request/record between any two users
researcherConnectionSchema.index({ requester: 1, receiver: 1 }, { unique: true });

const ResearcherConnection = mongoose.model('ResearcherConnection', researcherConnectionSchema);
export default ResearcherConnection;
