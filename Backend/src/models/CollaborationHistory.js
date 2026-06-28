import mongoose from 'mongoose';

const collaborationHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'History must belong to a user'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'StatusChange',
        'RequestSent',
        'RequestReceived',
        'RequestAccepted',
        'RequestRejected',
        'RequestWithdrawn',
        'ProjectStarted',
        'ProjectCompleted'
      ],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['CollaborationRequest', 'Collaboration'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const CollaborationHistory = mongoose.model('CollaborationHistory', collaborationHistorySchema);
export default CollaborationHistory;
