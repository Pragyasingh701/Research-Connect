import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Search history must belong to a user'],
      index: true,
    },
    keyword: {
      type: String,
      required: [true, 'Search keyword is required'],
      trim: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need search timestamp
  }
);

// Compound Index: Optimizes pulling history for a user sorted by latest first
searchHistorySchema.index({ user: 1, createdAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
