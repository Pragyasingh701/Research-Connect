import mongoose from 'mongoose';

const researchCollaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collaborator must belong to a user profile'],
      index: true,
    },
    collaboratorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Collaborator name is required'],
      trim: true,
    },
    scholarId: {
      type: String,
      trim: true,
      default: '',
    },
    scholarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    affiliation: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Ensure a collaborator is linked uniquely per user
researchCollaboratorSchema.index({ user: 1, scholarId: 1 }, { unique: true, sparse: true });

const ResearchCollaborator = mongoose.model('ResearchCollaborator', researchCollaboratorSchema);
export default ResearchCollaborator;
