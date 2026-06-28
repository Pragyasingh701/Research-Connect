import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fieldMetadataSchema from './fieldMetadataSchema.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null/undefined for users who register via Google
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['researcher', 'admin', 'reviewer', 'sponsor'],
      default: 'researcher',
    },
    followersCount: {
      type: Number,
      default: 0,
      index: true,
    },
    followingCount: {
      type: Number,
      default: 0,
      index: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'blocked', 'deleted'],
      default: 'pending_verification',
      index: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    passwordChangedAt: Date,
    fieldMetadata: {
      type: Map,
      of: fieldMetadataSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1, isDeleted: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update passwordChangedAt property before saving
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Soft delete query middleware
userSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Instance method to check if password is correct (legacy/compatibility)
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to compare password (modern)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token issuance
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
