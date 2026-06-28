import mongoose from 'mongoose';

const projectTaskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task must have a title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    deadline: Date,
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Review', 'Completed'],
      default: 'Todo',
      index: true,
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    checklist: [
      {
        text: {
          type: String,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
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

const ProjectTask = mongoose.model('ProjectTask', projectTaskSchema);
export default ProjectTask;
