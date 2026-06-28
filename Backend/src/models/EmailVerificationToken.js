import mongoose from 'mongoose';

const emailVerificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Token must belong to a user'],
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 }, // TTL index to automatically delete expired docs
    },
  },
  {
    timestamps: true,
    collection: 'email_verifications',
  }
);

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
export default EmailVerificationToken;
