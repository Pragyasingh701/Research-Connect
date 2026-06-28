import mongoose from 'mongoose';

const researchFeedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Research feed must belong to a user'],
      unique: true,
      index: true,
    },
    recommendedPublications: [
      {
        publication: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Publication',
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        breakdown: {
          keywordScore: { type: Number, default: 0 },
          researchAreaScore: { type: Number, default: 0 },
          pubSimilarityScore: { type: Number, default: 0 },
          networkScore: { type: Number, default: 0 },
          citationScore: { type: Number, default: 0 },
        },
      },
    ],
    recommendedResearchers: [
      {
        researcher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        sharedFieldsCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    recommendedJournals: [
      {
        type: String,
      },
    ],
    recommendedConferences: [
      {
        name: { type: String, required: true },
        date: Date,
        submissionDeadline: Date,
        link: String,
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add TTL Index to automatically delete expired feeds after the expiresAt date
researchFeedSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ResearchFeed = mongoose.model('ResearchFeed', researchFeedSchema);
export default ResearchFeed;
