import mongoose from 'mongoose';

const trustedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trusted device must belong to a user'],
    },
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      index: true,
    },
    browser: {
      type: String,
      required: [true, 'Browser identifier is required'],
    },
    os: {
      type: String,
      required: [true, 'Operating system is required'],
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
  },
  {
    timestamps: true,
    collection: 'trusted_devices',
  }
);

// Compound Unique Index: A user can trust a specific device only once
trustedDeviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

// TTL Index for automatic expiration after the expiresAt date (typically 30 days)
trustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TrustedDevice = mongoose.model('TrustedDevice', trustedDeviceSchema);
export default TrustedDevice;
