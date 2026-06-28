import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project must have a title'],
      trim: true,
      unique: true,
      index: true,
    },
    shortTitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Project must have a description'],
      trim: true,
    },
    researchDomain: {
      type: String,
      required: [true, 'Research domain is required'],
      trim: true,
      index: true,
    },
    researchArea: {
      type: String,
      trim: true,
      default: '',
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    objectives: [
      {
        type: String,
        trim: true,
      },
    ],
    expectedOutcomes: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'Individual',
        'Team',
        'University',
        'Industry',
        'Government',
        'International',
        'Open Source',
        'Funded',
        'Thesis',
        'Dissertation',
      ],
      default: 'Individual',
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'],
      default: 'Draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['Public', 'Private', 'Institution Only', 'Invite Only'],
      default: 'Public',
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have an owner'],
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    bannerUrl: {
      type: String,
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for rapid lookups and search
projectSchema.index({ title: 'text', description: 'text', keywords: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
