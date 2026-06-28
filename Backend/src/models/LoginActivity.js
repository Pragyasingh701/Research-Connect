import mongoose from 'mongoose';

const loginActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed_password', 'failed_otp', 'otp_sent', 'blocked'],
      required: [true, 'Login status is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
    },
    browser: {
      type: String,
      required: [true, 'Browser is required'],
    },
    os: {
      type: String,
      required: [true, 'Operating system is required'],
    },
    location: {
      type: String,
      default: 'Unknown',
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'login_activity',
  }
);

// Optimize sorting by creation date for a user
loginActivitySchema.index({ user: 1, createdAt: -1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);
export default LoginActivity;
