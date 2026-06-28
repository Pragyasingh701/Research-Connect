import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Researcher is required'],
      index: true,
    },
    recommendedResearcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recommended researcher is required'],
      index: true,
    },
    keywordScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    researchAreaScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    abstractScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    publicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalMatch: {
      type: Number,
      default: 0,
      index: true,
    },
    commonKeywords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Keyword',
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt as recommendations are static snapshots
  }
);

// Compound Index: Retrieve highest matches for a researcher rapidly
recommendationSchema.index({ researcher: 1, finalMatch: -1 });

// Pre-save hook to automatically calculate AI Recommendation score
recommendationSchema.pre('save', function (next) {
  // Formula: 40% Keyword + 25% Research Area + 20% Abstract + 15% Publication
  this.finalMatch = parseFloat(
    (
      this.keywordScore * 0.40 +
      this.researchAreaScore * 0.25 +
      this.abstractScore * 0.20 +
      this.publicationScore * 0.15
    ).toFixed(2)
  );
  next();
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);
export default Recommendation;
