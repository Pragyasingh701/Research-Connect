import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Experience must belong to a user'],
      index: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization is required'],
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'fellowship', 'postdoc', 'visiting'],
      default: 'full-time',
    },
    researchArea: {
      type: String,
      trim: true,
      default: '',
    },
    startYear: {
      type: Number,
      required: [true, 'Start year is required'],
    },
    startMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: 1,
    },
    endYear: {
      type: Number,
      default: null, // Null represents currently working here
    },
    endMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

// Soft delete query middleware
experienceSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;
