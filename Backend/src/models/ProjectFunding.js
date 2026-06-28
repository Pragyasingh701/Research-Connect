import mongoose from 'mongoose';

const projectFundingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Funding must belong to a project'],
      unique: true,
      index: true,
    },
    agency: {
      type: String,
      required: [true, 'Funding agency is required'],
      trim: true,
    },
    grantNumber: {
      type: String,
      trim: true,
      default: '',
    },
    budget: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    amountReceived: {
      type: Number,
      default: 0,
      min: [0, 'Amount received cannot be negative'],
    },
    remainingBudget: {
      type: Number,
      default: 0,
    },
    sponsor: {
      type: String,
      trim: true,
      default: '',
    },
    proposalStatus: {
      type: String,
      enum: ['Applied', 'Approved', 'Rejected', 'Completed'],
      default: 'Applied',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate remaining budget
projectFundingSchema.pre('save', function (next) {
  this.remainingBudget = this.budget - this.amountReceived;
  next();
});

const ProjectFunding = mongoose.model('ProjectFunding', projectFundingSchema);
export default ProjectFunding;
