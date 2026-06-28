import mongoose from 'mongoose';

const publicationAuthorSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Author must belong to a publication'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // If author is a registered user
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    affiliation: {
      type: String,
      trim: true,
      default: '',
    },
    orcid: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    authorOrder: {
      type: Number,
      required: [true, 'Author order is required'], // 1 for first author, 2 for second, etc.
    },
    correspondingAuthor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique author order per publication
publicationAuthorSchema.index({ publication: 1, authorOrder: 1 }, { unique: true });

// Helper to trigger recalculate on author save/delete
const triggerProfileRecalculate = async function (doc) {
  if (doc.user) {
    try {
      const Profile = mongoose.model('Profile');
      await Profile.recalculateMetrics(doc.user);
    } catch (err) {
      console.error(`Failed to recalculate profile metrics for user ${doc.user}: ${err.message}`);
    }
  }
};

publicationAuthorSchema.post('save', async function (doc) {
  await triggerProfileRecalculate(doc);
});

publicationAuthorSchema.post('remove', async function (doc) {
  await triggerProfileRecalculate(doc);
});

const PublicationAuthor = mongoose.model('PublicationAuthor', publicationAuthorSchema);
export default PublicationAuthor;
