import mongoose from 'mongoose';

const publicationAnalyticsSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Analytics must belong to a publication'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    reads: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
    recommendations: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Enforce a unique day-wise metrics entry per publication
publicationAnalyticsSchema.index({ publication: 1, date: 1 }, { unique: true });

const PublicationAnalytics = mongoose.model('PublicationAnalytics', publicationAnalyticsSchema);
export default PublicationAnalytics;
