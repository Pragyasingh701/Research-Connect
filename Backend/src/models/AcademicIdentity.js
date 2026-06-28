import mongoose from 'mongoose';

const academicIdentitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Academic identity must belong to a user'],
      index: true,
    },
    provider: {
      type: String,
      enum: ['google-scholar', 'orcid', 'scopus', 'researchgate', 'linkedin', 'semantic-scholar', 'openalex'],
      required: [true, 'Identity provider is required'],
    },
    identityId: {
      type: String,
      required: [true, 'Identity ID is required'],
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    accessToken: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      default: '',
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastSyncDate: {
      type: Date,
      default: Date.now,
    },
    importedMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Uniqueness of provider per user
academicIdentitySchema.index({ user: 1, provider: 1 }, { unique: true });

const AcademicIdentity = mongoose.model('AcademicIdentity', academicIdentitySchema);
export default AcademicIdentity;
