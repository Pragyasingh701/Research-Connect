import mongoose from 'mongoose';

const researcherSimilaritySchema = new mongoose.Schema(
  {
    researcherA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Researcher A is required'],
    },
    researcherB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Researcher B is required'],
      index: true,
    },
    similarityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'Similarity score is required'],
      index: true,
    },
    matchLevel: {
      type: String,
      enum: ['Very High Match', 'High Match', 'Medium Match', 'Low Match'],
      index: true,
    },
    breakdown: {
      keywordMatchScore: { type: Number, default: 0 },
      publicationSimilarityScore: { type: Number, default: 0 },
      semanticScore: { type: Number, default: 0 },
      coauthorshipScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      institutionScore: { type: Number, default: 0 },
    },
    commonKeywords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Keyword',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness and fast lookup of pairings
researcherSimilaritySchema.index({ researcherA: 1, researcherB: 1 }, { unique: true });
researcherSimilaritySchema.index({ researcherA: 1, similarityScore: -1 });

// Automatically calculate match level before saving
researcherSimilaritySchema.pre('save', function (next) {
  if (this.similarityScore >= 85) {
    this.matchLevel = 'Very High Match';
  } else if (this.similarityScore >= 60) {
    this.matchLevel = 'High Match';
  } else if (this.similarityScore >= 30) {
    this.matchLevel = 'Medium Match';
  } else {
    this.matchLevel = 'Low Match';
  }
  next();
});

const ResearcherSimilarity = mongoose.model('ResearcherSimilarity', researcherSimilaritySchema);
export default ResearcherSimilarity;
