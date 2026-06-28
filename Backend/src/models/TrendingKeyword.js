import mongoose from 'mongoose';

const trendingKeywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Keyword',
      required: [true, 'Keyword reference is required'],
      unique: true,
      index: true,
    },
    searchCount: {
      type: Number,
      default: 0,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      index: true,
    },
    growthRate: {
      type: Number,
      default: 0, // percentage growth
      index: true,
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const TrendingKeyword = mongoose.model('TrendingKeyword', trendingKeywordSchema);
export default TrendingKeyword;
