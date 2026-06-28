import mongoose from 'mongoose';

const projectAnalyticsSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Analytics must belong to a project'],
      unique: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0, // In percentage, e.g. 0 to 100
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    pendingTasks: {
      type: Number,
      default: 0,
    },
    publicationsCount: {
      type: Number,
      default: 0,
    },
    citationsCount: {
      type: Number,
      default: 0,
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    fundingUtilization: {
      type: Number,
      default: 0, // In percentage
    },
    activityCount: {
      type: Number,
      default: 0,
    },
    teamProductivity: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        completedTasksCount: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ProjectAnalytics = mongoose.model('ProjectAnalytics', projectAnalyticsSchema);
export default ProjectAnalytics;
