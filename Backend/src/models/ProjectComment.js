import mongoose from 'mongoose';

const projectCommentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Comment must belong to a project'],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTask',
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have an author'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ProjectComment = mongoose.model('ProjectComment', projectCommentSchema);
export default ProjectComment;
