import mongoose from 'mongoose';

const externalAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'googleScholar',
      index: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    profileUrl: {
      type: String,
      default: '',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    syncStatus: {
      type: String,
      enum: ['connected', 'synced', 'error'],
      default: 'connected',
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    importVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique provider per user account
externalAccountSchema.index({ user: 1, provider: 1 }, { unique: true });

const ExternalAccount = mongoose.model('ExternalAccount', externalAccountSchema);
export default ExternalAccount;
