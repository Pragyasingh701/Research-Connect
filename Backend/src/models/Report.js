import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must be filed by a user'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reportType: {
      type: String,
      enum: ['User', 'Publication'],
      required: [true, 'Report type is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the report'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Compound Index: Optimizes fetching open reports of a certain type
reportSchema.index({ reportType: 1, status: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
