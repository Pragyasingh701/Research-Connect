import mongoose from 'mongoose';

const collaborationStatusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collaboration status must belong to a user'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Open for Collaboration',
        'Available for Selected Projects',
        'Looking for Co-authors',
        'Looking for Research Funding',
        'Looking for Supervisor',
        'Looking for PhD Students',
        'Looking for Master\'s Students',
        'Looking for Interns',
        'Looking for Industry Partners',
        'Currently Not Available'
      ],
      default: 'Open for Collaboration',
      required: [true, 'Collaboration status is required'],
      index: true,
    },
    visibility: {
      type: String,
      enum: ['Public', 'Connections Only', 'Registered Users'],
      default: 'Public',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to update lastUpdated and push to history if status changes
collaborationStatusSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.lastUpdated = Date.now();
    this.history.push({
      status: this.status,
      changedAt: Date.now(),
    });
  }
  next();
});

const CollaborationStatus = mongoose.model('CollaborationStatus', collaborationStatusSchema);
export default CollaborationStatus;
