import mongoose from 'mongoose';

const publicationResearchAreaSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Publication is required'],
    },
    researchArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchArea',
      required: [true, 'Research Area is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Uniqueness of research area per publication
publicationResearchAreaSchema.index({ publication: 1, researchArea: 1 }, { unique: true });

const PublicationResearchArea = mongoose.model('PublicationResearchArea', publicationResearchAreaSchema);
export default PublicationResearchArea;
