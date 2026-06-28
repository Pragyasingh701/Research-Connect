import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
    },
    departments: {
      type: [String],
      default: [],
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    ranking: {
      type: Number,
      default: 999,
    },
    type: {
      type: String,
      enum: ['Academic', 'Corporate', 'Government', 'Non-profit', 'Other'],
      default: 'Academic',
    },
    stats: {
      researchersCount: { type: Number, default: 0, index: true },
      publicationsCount: { type: Number, default: 0, index: true },
      citationsCount: { type: Number, default: 0, index: true },
    },
  },
  {
    timestamps: true,
  }
);

// Text Index for search
institutionSchema.index({ name: 'text', country: 'text', description: 'text' });

const Institution = mongoose.model('Institution', institutionSchema);
export default Institution;
