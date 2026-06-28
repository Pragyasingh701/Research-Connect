import mongoose from 'mongoose';
import fieldMetadataSchema from './fieldMetadataSchema.js';

const academicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Academic profile must belong to a user'],
      unique: true,
      index: true,
    },
    orcid: {
      type: String,
      trim: true,
      default: '',
      match: [/^(?:\d{4}-\d{4}-\d{4}-\d{3}[0-9X])?$/, 'Please provide a valid ORCID ID (e.g. 0000-0002-1825-0097)'],
    },
    googleScholar: {
      type: String,
      trim: true,
      default: '',
    },
    scopusId: {
      type: String,
      trim: true,
      default: '',
    },
    researchGate: {
      type: String,
      trim: true,
      default: '',
    },
    linkedIn: {
      type: String,
      trim: true,
      default: '',
    },
    personalWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    rawScholarData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fieldMetadata: {
      type: Map,
      of: fieldMetadataSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const AcademicProfile = mongoose.model('AcademicProfile', academicProfileSchema);
export default AcademicProfile;
