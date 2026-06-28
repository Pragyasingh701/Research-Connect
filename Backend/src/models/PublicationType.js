import mongoose from 'mongoose';

const specificFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select'],
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const publicationTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Publication type name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Publication type slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['published-research', 'preprint', 'presentation', 'poster', 'data', 'methods-proposal-code'],
      index: true,
    },
    specificFields: {
      type: [specificFieldSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const PublicationType = mongoose.model('PublicationType', publicationTypeSchema);
export default PublicationType;
