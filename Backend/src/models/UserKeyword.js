import mongoose from 'mongoose';

const userKeywordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    keyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Keyword',
      required: [true, 'Keyword is required'],
      index: true,
    },
    source: {
      type: String,
      enum: ['manual', 'googleScholar', 'orcid', 'scopus', 'linkedin'],
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
  {
    timestamps: true,
  }
);

// Compound Index: Enforce uniqueness of user-keyword association
userKeywordSchema.index({ user: 1, keyword: 1 }, { unique: true });

const UserKeyword = mongoose.model('UserKeyword', userKeywordSchema);
export default UserKeyword;
