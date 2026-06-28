import mongoose from 'mongoose';

const collaborationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collaboration preference must belong to a user'],
      unique: true,
      index: true,
    },
    researchInterests: {
      type: [String],
      default: [],
    },
    preferredCollaborationType: {
      type: [String],
      enum: [
        'Research Paper',
        'Journal Publication',
        'Conference Paper',
        'Book Writing',
        'Grant Proposal',
        'Patent',
        'Dataset Creation',
        'Open Source Project',
        'Software Development',
        'Experiment',
        'Literature Review'
      ],
      default: [],
    },
    collaborationMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    availability: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Weekends', 'Flexible'],
      default: 'Flexible',
    },
    preferredCountries: {
      type: [String],
      default: [],
    },
    preferredInstitutions: {
      type: [String],
      default: [],
    },
    preferredLanguages: {
      type: [String],
      default: [],
    },
    preferredTimeZone: {
      type: String,
      default: '',
    },
    preferredCommunication: {
      type: String,
      enum: ['Email', 'Platform Chat', 'Video Meeting'],
      default: 'Platform Chat',
    },
    maxActiveCollaborations: {
      type: Number,
      default: 5,
    },
    experienceLevel: {
      type: String,
      enum: ['Student', 'Research Scholar', 'Assistant Professor', 'Professor', 'Industry Researcher'],
      default: 'Research Scholar',
    },
    fundingAvailable: {
      type: Boolean,
      default: false,
    },
    travelAvailable: {
      type: Boolean,
      default: false,
    },
    expectedStartDate: {
      type: Date,
    },
    expectedEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const CollaborationPreference = mongoose.model('CollaborationPreference', collaborationPreferenceSchema);
export default CollaborationPreference;
