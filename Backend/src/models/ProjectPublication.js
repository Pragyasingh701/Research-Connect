import mongoose from 'mongoose';

const projectPublicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project publication must belong to a project'],
      index: true,
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Publication title is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'Published Papers',
        'Draft Papers',
        'Conference Papers',
        'Patents',
        'Posters',
        'Presentations',
      ],
      default: 'Draft Papers',
      index: true,
    },
    authors: [
      {
        type: String,
        trim: true,
      },
    ],
    doi: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectPublication = mongoose.model('ProjectPublication', projectPublicationSchema);
export default ProjectPublication;
