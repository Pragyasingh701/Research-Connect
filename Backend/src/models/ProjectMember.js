import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project member must belong to a project'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project member must be a user'],
      index: true,
    },
    role: {
      type: String,
      enum: [
        'Principal Investigator (PI)',
        'Co-Principal Investigator',
        'Research Supervisor',
        'Research Associate',
        'Research Scholar',
        'Student',
        'Developer',
        'Data Analyst',
        'Reviewer',
        'External Collaborator',
      ],
      required: [true, 'Role is required'],
    },
    permission: {
      type: String,
      enum: ['Owner', 'Admin', 'Editor', 'Viewer'],
      default: 'Viewer',
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Declined'],
      default: 'Pending',
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate memberships in the same project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
export default ProjectMember;
