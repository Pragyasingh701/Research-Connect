import mongoose from 'mongoose';

const projectFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'File must belong to a project'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    folder: {
      type: String,
      default: '/',
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'File public storage ID is required'],
    },
    size: {
      type: Number, // In bytes
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    versions: [
      {
        url: String,
        publicId: String,
        versionNum: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly search by folder and project
projectFileSchema.index({ project: 1, folder: 1 });

const ProjectFile = mongoose.model('ProjectFile', projectFileSchema);
export default ProjectFile;
