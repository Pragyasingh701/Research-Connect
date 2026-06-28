import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Saved search name is required'],
      trim: true,
    },
    query: {
      type: String,
      trim: true,
      default: '',
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    searchType: {
      type: String,
      enum: ['all', 'researchers', 'publications', 'institutions'],
      default: 'all',
    },
  },
  {
    timestamps: true,
  }
);

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);
export default SavedSearch;
