import mongoose from 'mongoose';
import fieldMetadataSchema from './fieldMetadataSchema.js';

const researchMetricsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Metrics must belong to a user'],
      unique: true,
      index: true,
    },
    totalPublications: {
      type: Number,
      default: 0,
    },
    totalCitations: {
      type: Number,
      default: 0,
    },
    citationsSinceLastYear: {
      type: Number,
      default: 0,
    },
    hIndex: {
      type: Number,
      default: 0,
    },
    hIndexSinceLastYear: {
      type: Number,
      default: 0,
    },
    i10Index: {
      type: Number,
      default: 0,
    },
    i10IndexSinceLastYear: {
      type: Number,
      default: 0,
    },
    totalCoAuthors: {
      type: Number,
      default: 0,
    },
    citationsByYear: [
      {
        year: { type: Number, required: true },
        citations: { type: Number, required: true },
      },
    ],
    fieldMetadata: {
      type: Map,
      of: fieldMetadataSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const ResearchMetrics = mongoose.model('ResearchMetrics', researchMetricsSchema);
export default ResearchMetrics;
