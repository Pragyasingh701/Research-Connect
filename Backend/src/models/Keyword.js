import mongoose from 'mongoose';

const keywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: [true, 'Keyword is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    parentKeyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Keyword',
      default: null,
      index: true,
    },
    synonyms: {
      type: [String],
      default: [],
    },
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },
    numberOfResearchers: {
      type: Number,
      default: 0,
      index: true,
    },
    numberOfPublications: {
      type: Number,
      default: 0,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text Index for keyword searching and synonym matching
keywordSchema.index({ keyword: 'text', synonyms: 'text', description: 'text' });

// Pre-save hook to generate URL slug from keyword
keywordSchema.pre('save', function (next) {
  if (this.isModified('keyword')) {
    this.slug = this.keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  }
  next();
});

const Keyword = mongoose.model('Keyword', keywordSchema);
export default Keyword;
