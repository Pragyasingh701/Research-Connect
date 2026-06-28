import mongoose from 'mongoose';

const userResearchAreaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    researchArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchArea',
      required: [true, 'Research Area is required'],
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

// Compound Index: Enforce uniqueness of user-researchArea association
userResearchAreaSchema.index({ user: 1, researchArea: 1 }, { unique: true });

const UserResearchArea = mongoose.model('UserResearchArea', userResearchAreaSchema);
export default UserResearchArea;
