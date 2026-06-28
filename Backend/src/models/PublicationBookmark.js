import mongoose from 'mongoose';

const publicationBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bookmark must belong to a user'],
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Bookmark must point to a publication'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Unique bookmark per user-publication pair
publicationBookmarkSchema.index({ user: 1, publication: 1 }, { unique: true });

const PublicationBookmark = mongoose.model('PublicationBookmark', publicationBookmarkSchema);
export default PublicationBookmark;
