import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
      trim: true,
    },
    folder: {
      type: String,
      required: [true, 'Folder path is required'],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, 'Public storage ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: [true, 'Secure URL is required'],
      trim: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
    },
    format: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
      index: true,
    },
    uploadType: {
      type: String,
      required: [true, 'Upload type is required'],
      enum: [
        'profile-image',
        'cover-image',
        'publication-pdf',
        'publication-cover',
        'publication-supplementary',
        'project-file',
        'project-image',
        'project-dataset',
        'presentation',
        'poster',
        'dataset',
        'patent',
        'proposal',
        'thesis',
        'report',
        'code',
        'logo',
        'temp',
      ],
    },
    publicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'files',
  }
);

const File = mongoose.model('File', fileSchema);
export default File;
