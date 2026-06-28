import mongoose from 'mongoose';

const fieldMetadataSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['manual', 'googleScholar', 'orcid', 'scopus', 'linkedin'],
      required: true,
      default: 'manual',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    syncVersion: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

export default fieldMetadataSchema;
