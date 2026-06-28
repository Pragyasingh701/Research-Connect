import mongoose from 'mongoose';

const downloadAnalyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Download must refer to a publication'],
      index: true,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    institution: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

const DownloadAnalytics = mongoose.model('DownloadAnalytics', downloadAnalyticsSchema);
export default DownloadAnalytics;
