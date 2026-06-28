import mongoose from 'mongoose';

const publicationReferenceSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'Reference must belong to a publication'],
      index: true,
    },
    rawCitationString: {
      type: String,
      required: [true, 'Citation string is required'],
      trim: true,
    },
    doi: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    referencedPublication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const PublicationReference = mongoose.model('PublicationReference', publicationReferenceSchema);
export default PublicationReference;
