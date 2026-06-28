import mongoose from 'mongoose';

const projectActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Activity must belong to a project'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must have a performer'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Activity must have an action'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Activity must have details'],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectActivity = mongoose.model('ProjectActivity', projectActivitySchema);
export default ProjectActivity;
