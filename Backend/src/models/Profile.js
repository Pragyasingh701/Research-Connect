import mongoose from 'mongoose';
import './AcademicProfile.js';
import './UserResearchArea.js';
import './UserKeyword.js';
import './Education.js';
import './Experience.js';
import fieldMetadataSchema from './fieldMetadataSchema.js';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Profile must belong to a user'],
      unique: true,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    institution: {
      type: String,
      required: [true, 'Please provide your institution or organization name'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Please provide your country'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    highestQualification: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: Number,
      default: 0, // In years
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say',
    },
    dateOfBirth: Date,
    languages: {
      type: [String],
      default: [],
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'student', 'retired', 'other'],
      default: 'employed',
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public',
      index: true,
    },
    privacySettings: {
      allowFollowFrom: {
        type: String,
        enum: ['anyone', 'researchers'],
        default: 'anyone',
      },
      followersHidden: {
        type: Boolean,
        default: false,
      },
      followingHidden: {
        type: Boolean,
        default: false,
      },
      activityPrivacy: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public',
      },
    },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      github: { type: String, default: '' },
      researchgate: { type: String, default: '' },
      orcid: { type: String, default: '' },
    },
    profileCompletion: {
      type: Number,
      default: 0, // Percentage
    },
    // Academic Metrics
    publications: {
      type: Number,
      default: 0,
      index: true,
    },
    citations: {
      type: Number,
      default: 0,
      index: true,
    },
    hIndex: {
      type: Number,
      default: 0,
      index: true,
    },
    i10Index: {
      type: Number,
      default: 0,
      index: true,
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

// Compound Index for geolocation/institutional searching
profileSchema.index({ country: 1, institution: 1 });

// Virtual populate for Academic Profiles
profileSchema.virtual('academicProfile', {
  ref: 'AcademicProfile',
  foreignField: 'user',
  localField: 'user',
  justOne: true,
});

// Virtual populate for Research Metrics
profileSchema.virtual('researchMetrics', {
  ref: 'ResearchMetrics',
  foreignField: 'user',
  localField: 'user',
  justOne: true,
});

// Virtual populate for User Research Areas
profileSchema.virtual('researchAreas', {
  ref: 'UserResearchArea',
  foreignField: 'user',
  localField: 'user',
});

// Virtual populate for User Keywords
profileSchema.virtual('keywords', {
  ref: 'UserKeyword',
  foreignField: 'user',
  localField: 'user',
});

// Virtual populate for Education List
profileSchema.virtual('educationList', {
  ref: 'Education',
  foreignField: 'user',
  localField: 'user',
  options: { sort: { sortOrder: 1, startYear: -1 } }
});

// Virtual populate for Experience List
profileSchema.virtual('experienceList', {
  ref: 'Experience',
  foreignField: 'user',
  localField: 'user',
  options: { sort: { sortOrder: 1, startYear: -1 } }
});

// Pre-save hook to calculate Profile Completion Rate
profileSchema.pre('save', function (next) {
  let fieldsCount = 0;
  let filledFields = 0;

  const weights = {
    bio: 10,
    designation: 10,
    institution: 15,
    country: 10,
    state: 5,
    city: 5,
    highestQualification: 10,
    experience: 10,
    phone: 5,
    website: 5,
    profilePhoto: 10,
    coverPhoto: 5
  };

  let totalWeight = Object.values(weights).reduce((a, b) => a + b, 0); // 100
  let score = 0;

  for (const [field, weight] of Object.entries(weights)) {
    if (this[field] && this[field] !== '') {
      score += weight;
    }
  }

  this.profileCompletion = score;
  next();
});

// Static method to recalculate researcher academic metrics (publications, citations, h-index, i10-index)
profileSchema.statics.recalculateMetrics = async function (userId) {
  const Publication = mongoose.model('Publication');
  const PublicationAuthor = mongoose.model('PublicationAuthor');

  // Fetch all author entries linked to this user
  const authorEntries = await PublicationAuthor.find({ user: userId }).select('publication');
  const publicationIds = authorEntries.map(entry => entry.publication);

  // Fetch corresponding non-deleted publications
  const publications = await Publication.find({
    _id: { $in: publicationIds },
    isDeleted: { $ne: true }
  }).select('citationCount');

  const totalPublications = publications.length;
  const totalCitations = publications.reduce((sum, pub) => sum + (pub.citationCount || 0), 0);

  // Sort citations in descending order for h-index
  const citationsArray = publications.map(pub => pub.citationCount || 0).sort((a, b) => b - a);
  
  // Calculate h-index
  let hIndex = 0;
  while (hIndex < citationsArray.length && citationsArray[hIndex] >= hIndex + 1) {
    hIndex++;
  }

  // Calculate i10-index (number of papers with >= 10 citations)
  const i10Index = citationsArray.filter(c => c >= 10).length;

  return await this.findOneAndUpdate(
    { user: userId },
    {
      publications: totalPublications,
      citations: totalCitations,
      hIndex,
      i10Index
    },
    { new: true, upsert: true }
  );
};

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
