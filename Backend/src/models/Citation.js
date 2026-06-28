import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    citingPublication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Citing publication is required'],
      index: true,
    },
    citedPublication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Cited publication is required'],
      index: true,
    },
    citationDate: {
      type: Date,
      default: Date.now,
    },
    citationSource: {
      type: String,
      trim: true,
      default: 'internal',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate citation records
citationSchema.index({ citingPublication: 1, citedPublication: 1 }, { unique: true });

const Citation = mongoose.model('Citation', citationSchema);
export default Citation;
