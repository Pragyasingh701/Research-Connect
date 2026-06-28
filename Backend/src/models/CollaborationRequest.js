import mongoose from 'mongoose';

const collaborationRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    researchArea: {
      type: String,
      required: [true, 'Research area is required'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of collaboration is required'],
      trim: true,
    },
    expectedContribution: {
      type: String,
      required: [true, 'Expected contribution is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    timeline: {
      type: String,
      required: [true, 'Timeline is required'],
      trim: true,
    },
    fundingAvailable: {
      type: Boolean,
      default: false,
    },
    attachments: {
      type: [String],
      default: [], // URLs to files on Cloudinary
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Withdrawn', 'Completed'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Enforce fast lookups of requests between specific users
collaborationRequestSchema.index({ sender: 1, receiver: 1 });
collaborationRequestSchema.index({ receiver: 1, status: 1 });

const CollaborationRequest = mongoose.model('CollaborationRequest', collaborationRequestSchema);
export default CollaborationRequest;
