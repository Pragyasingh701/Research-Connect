import mongoose from 'mongoose';

const researchDomainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Domain name is required'],
      unique: true,
      trim: true,
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
    parentDomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchDomain',
      default: null,
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text search support
researchDomainSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to generate slug
researchDomainSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  }
  next();
});

const ResearchDomain = mongoose.model('ResearchDomain', researchDomainSchema);
export default ResearchDomain;
