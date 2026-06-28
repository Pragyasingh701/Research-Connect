import mongoose from 'mongoose';

const publicationKeywordSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Publication is required'],
    },
    keyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Keyword',
      required: [true, 'Keyword is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Uniqueness of keyword per publication
publicationKeywordSchema.index({ publication: 1, keyword: 1 }, { unique: true });

const PublicationKeyword = mongoose.model('PublicationKeyword', publicationKeywordSchema);
export default PublicationKeyword;
