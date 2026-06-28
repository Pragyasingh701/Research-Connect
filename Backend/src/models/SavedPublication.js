import mongoose from 'mongoose';

const savedPublicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bookmark must belong to a user'],
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Bookmark must refer to a publication'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt for bookmark history
  }
);

// Compound Index: Ensure a user can only save a specific publication once
savedPublicationSchema.index({ user: 1, publication: 1 }, { unique: true });

const SavedPublication = mongoose.model('SavedPublication', savedPublicationSchema);
export default SavedPublication;
