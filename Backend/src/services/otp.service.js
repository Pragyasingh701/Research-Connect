import crypto from 'crypto';
import OTP from '../models/OTP.js';
import AppError from '../utils/AppError.js';
import * as emailService from './email.service.js';

// Configuration constants
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_DAILY_OTP_REQUESTS = 5;

/**
 * Hash an OTP string using SHA-256
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Generate a random 6-digit OTP code
 */
const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request OTP: check cooldown, daily limits, generate, hash, save, and email it.
 */
export const requestOTP = async (user, purpose) => {
  const userId = user._id;

  // 1. Check if there was an OTP requested within the 60-second cooldown period
  const lastOTP = await OTP.findOne({ user: userId, purpose }).sort({ createdAt: -1 });
  if (lastOTP && (Date.now() - lastOTP.createdAt.getTime() < RESEND_COOLDOWN_MS)) {
    const elapsedSeconds = Math.round((Date.now() - lastOTP.createdAt.getTime()) / 1000);
    throw new AppError(`Please wait ${60 - elapsedSeconds} seconds before requesting a new OTP.`, 429);
  }

  // 2. Check maximum daily requests count (24 hours rolling window)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyRequestsCount = await OTP.countDocuments({
    user: userId,
    purpose,
    createdAt: { $gte: oneDayAgo }
  });

  if (dailyRequestsCount >= MAX_DAILY_OTP_REQUESTS) {
    throw new AppError('Maximum daily OTP request limit reached. Please try again tomorrow.', 429);
  }

  // 3. Delete any previous active OTPs for this user and purpose
  await OTP.deleteMany({ user: userId, purpose });

  // 4. Generate random 6-digit code and calculate expiry
  const code = process.env.NODE_ENV === 'development' ? '123456' : generateRandomCode();
  const hashedCode = hashOTP(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // 5. Create OTP document
  await OTP.create({
    user: userId,
    email: user.email,
    otp: hashedCode,
    purpose,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // 6. Send the One-Time Password via email
  await emailService.sendOTPEmail(user.email, code, purpose, 5);

  return { success: true, expiresAt, code };
};

/**
 * Verify OTP: check expiry, attempts limit, and match hashed values.
 */
export const verifyOTPCode = async (userId, inputCode, purpose) => {
  if (!inputCode || inputCode.length !== 6) {
    throw new AppError('Verification code must be exactly 6 digits.', 400);
  }

  // 1. Find the latest active OTP document for the given user and purpose
  const otpDoc = await OTP.findOne({ user: userId, purpose }).sort({ createdAt: -1 });
  
  if (!otpDoc) {
    throw new AppError('No verification code requested or session expired. Please request a new OTP.', 404);
  }

  // 2. Check if the code is expired
  if (otpDoc.expiresAt < new Date()) {
    await OTP.findByIdAndDelete(otpDoc._id);
    throw new AppError('Verification code has expired. Please request a new OTP.', 400);
  }

  // 3. Check if verification attempts exceeded limits
  if (otpDoc.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await OTP.findByIdAndDelete(otpDoc._id);
    throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', 400);
  }

  // 4. Increment attempts counter in database
  otpDoc.attempts += 1;
  await otpDoc.save();

  // 5. Check match
  const inputHash = hashOTP(inputCode);
  if (otpDoc.otp !== inputHash) {
    const remaining = MAX_VERIFICATION_ATTEMPTS - otpDoc.attempts;
    if (remaining <= 0) {
      await OTP.findByIdAndDelete(otpDoc._id);
      throw new AppError('Invalid code. Maximum attempts exceeded. Please request a new OTP.', 400);
    }
    throw new AppError(`Invalid verification code. You have ${remaining} attempts remaining.`, 400);
  }

  // 6. OTP validated successfully! Delete code from DB to ensure single use
  await OTP.findByIdAndDelete(otpDoc._id);

  return { success: true };
};
