import mongoose from 'mongoose';
import './PublicationAuthor.js';
import './PublicationKeyword.js';
import './PublicationResearchArea.js';
import fieldMetadataSchema from './fieldMetadataSchema.js';

const fileObjectSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: '' },
    secureUrl: { type: String, default: '' },
    folder: { type: String, default: '' },
    size: { type: Number, default: 0 },
    format: { type: String, default: '' },
  },
  { _id: false }
);

const publicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Publication must be created by a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Publication must have a title'],
      trim: true,
      unique: true, // Duplicate prevention on titles
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    abstract: {
      type: String,
      required: [true, 'Publication must have an abstract'],
      trim: true,
    },
    doi: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls/undefineds
      trim: true,
      index: true,
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    journal: {
      type: String,
      trim: true,
      default: '',
    },
    publicationDate: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    coverImage: {
      type: fileObjectSchema,
      default: () => ({}),
    },
    conference: {
      type: String,
      trim: true,
      default: '',
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      index: true,
    },
    publicationType: {
      type: String,
      required: [true, 'Publication type is required'],
      index: true,
    },
    language: {
      type: String,
      trim: true,
      default: 'English',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    fundingInfo: {
      type: String,
      trim: true,
      default: '',
    },
    grantNumber: {
      type: String,
      trim: true,
      default: '',
    },
    license: {
      type: String,
      trim: true,
      default: 'CC-BY-4.0',
    },
    version: {
      type: Number,
      default: 1,
    },
    commentsEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    specificFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedPublications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication',
      },
    ],
    references: {
      type: [String],
      default: [],
    },
    citationCount: {
      type: Number,
      default: 0,
      min: [0, 'Citation count cannot be negative'],
      index: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: '',
    },
    pdf: {
      type: fileObjectSchema,
      default: () => ({}),
    },
    supplementaryFiles: {
      type: [fileObjectSchema],
      default: [],
    },
    datasets: {
      type: [fileObjectSchema],
      default: [],
    },
    posters: {
      type: [fileObjectSchema],
      default: [],
    },
    presentations: {
      type: [fileObjectSchema],
      default: [],
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public',
      index: true,
    },
    publisherUrl: {
      type: String,
      trim: true,
      default: '',
    },
    scholarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    doiUrl: {
      type: String,
      trim: true,
      default: '',
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sourceType: {
      type: String,
      enum: ['google_scholar', 'user_uploaded', 'imported', 'other'],
      default: 'user_uploaded',
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    volume: {
      type: String,
      default: '',
    },
    issue: {
      type: String,
      default: '',
    },
    pages: {
      type: String,
      default: '',
    },
    publicationUrl: {
      type: String,
      default: '',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    fieldMetadata: {
      type: Map,
      of: fieldMetadataSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Compound index for user publication years (for rapid retrieval of author CV timelines)
publicationSchema.index({ user: 1, publicationYear: -1 });
// Compound index for status and deletion
publicationSchema.index({ status: 1, isDeleted: 1 });
// Text index for global search
publicationSchema.index({ title: 'text', abstract: 'text' });

// Virtual populates
publicationSchema.virtual('authors', {
  ref: 'PublicationAuthor',
  foreignField: 'publication',
  localField: '_id',
});

publicationSchema.virtual('keywords', {
  ref: 'PublicationKeyword',
  foreignField: 'publication',
  localField: '_id',
});

publicationSchema.virtual('researchAreas', {
  ref: 'PublicationResearchArea',
  foreignField: 'publication',
  localField: '_id',
});

// Soft delete query middleware
publicationSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Pre-validate hook to handle string values gracefully (e.g. from seed or imports)
publicationSchema.pre('validate', function (next) {
  if (typeof this.coverImage === 'string') {
    this.coverImage = { secureUrl: this.coverImage };
  }
  if (typeof this.pdf === 'string') {
    this.pdf = { secureUrl: this.pdf };
  }
  next();
});

// Pre-save hook to synchronize string URLs with object urls for compatibility
publicationSchema.pre('save', function (next) {
  if (this.pdf && this.pdf.secureUrl) {
    this.pdfUrl = this.pdf.secureUrl;
    this.fileUrl = this.pdf.secureUrl;
  }
  next();
});

// Pre-save hook to generate a unique slug
publicationSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    let uniqueSlug = baseSlug || 'publication';
    let count = 0;
    const PublicationModel = mongoose.model('Publication');
    
    while (true) {
      const checkSlug = count === 0 ? uniqueSlug : `${uniqueSlug}-${count}`;
      const existing = await PublicationModel.findOne({ slug: checkSlug, _id: { $ne: this._id } });
      if (!existing) {
        this.slug = checkSlug;
        break;
      }
      count++;
    }
  }
  next();
});

// Helper function to trigger metrics recalculation for all registered authors
const triggerAuthorsMetricsUpdate = async function (pubId) {
  try {
    const PublicationAuthor = mongoose.model('PublicationAuthor');
    const Profile = mongoose.model('Profile');

    const authors = await PublicationAuthor.find({ publication: pubId, user: { $exists: true, $ne: null } }).select('user');
    for (const author of authors) {
      await Profile.recalculateMetrics(author.user);
    }
  } catch (err) {
    console.error(`Failed to update author metrics for publication ${pubId}: ${err.message}`);
  }
};

// Post-save hook to update author profiles when publications/citations change
publicationSchema.post('save', async function (doc) {
  await triggerAuthorsMetricsUpdate(doc._id);
});

// Post-remove/delete hook
publicationSchema.post('remove', async function (doc) {
  await triggerAuthorsMetricsUpdate(doc._id);
});

const Publication = mongoose.model('Publication', publicationSchema);
export default Publication;
