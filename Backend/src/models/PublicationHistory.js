import mongoose from 'mongoose';

const publicationHistorySchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: [true, 'History log must reference a publication'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed action is required'],
    },
    action: {
      type: String,
      enum: ['create', 'update_metadata', 'upload_file', 'delete_file', 'publish_version', 'restore_version', 'soft_delete', 'restore'],
      required: [true, 'Action is required'],
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const PublicationHistory = mongoose.model('PublicationHistory', publicationHistorySchema);
export default PublicationHistory;
