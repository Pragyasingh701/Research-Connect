import mongoose from 'mongoose';

const publicationVersionSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Version must belong to a publication'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
    },
    changesDescription: {
      type: String,
      trim: true,
      default: '',
    },
    snapshot: {
      title: { type: String, required: true },
      abstract: { type: String, default: '' },
      publisher: { type: String, default: '' },
      journal: { type: String, default: '' },
      publicationYear: { type: Number },
      publicationType: { type: String },
      authors: [
        {
          name: String,
          email: String,
          user: mongoose.Schema.Types.ObjectId,
          institution: String,
          authorOrder: Number,
        },
      ],
      pdfUrl: { type: String, default: '' },
      fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicationFile' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of version number per publication
publicationVersionSchema.index({ publication: 1, versionNumber: -1 }, { unique: true });

const PublicationVersion = mongoose.model('PublicationVersion', publicationVersionSchema);
export default PublicationVersion;
