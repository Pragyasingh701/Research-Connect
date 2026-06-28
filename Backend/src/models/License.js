import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'License name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'License code is required'],
      unique: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const License = mongoose.model('License', licenseSchema);
export default License;
