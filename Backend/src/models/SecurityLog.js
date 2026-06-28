import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Security log must belong to a user'],
      index: true,
    },
    action: {
      type: String,
      enum: [
        'password_change',
        'email_change',
        'two_factor_toggle',
        'session_terminated',
        'all_sessions_terminated',
        'account_recovery_requested',
        'account_recovered',
      ],
      required: [true, 'Security action is required'],
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
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'security_logs',
  }
);

// Optimize query for fetching security audit logs for a user
securityLogSchema.index({ user: 1, createdAt: -1 });

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
export default SecurityLog;
