import mongoose from 'mongoose';

const researchInterestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    domains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResearchDomain',
      },
    ],
    keywords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Keyword',
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ResearchInterest = mongoose.model('ResearchInterest', researchInterestSchema);
export default ResearchInterest;
