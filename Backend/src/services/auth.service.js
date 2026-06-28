import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import RefreshToken from '../models/RefreshToken.js';
import Session from '../models/Session.js';
import TrustedDevice from '../models/TrustedDevice.js';
import LoginActivity from '../models/LoginActivity.js';
import SecurityLog from '../models/SecurityLog.js';
import AcademicProfile from '../models/AcademicProfile.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import AppError from '../utils/AppError.js';
import * as scholarService from './scholar.service.js';
import * as otpService from './otp.service.js';
import * as emailService from './email.service.js';

/**
 * Sign JWT Token Helper
 */
const signToken = (id, role, secret, expiresIn) => {
  return jwt.sign({ id, role }, secret, { expiresIn });
};

/**
 * Parse User-Agent string to extract Browser and OS
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';

  // Simple Browser Detection
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'Internet Explorer';
  }

  // Simple OS Detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  }

  return { browser, os };
};

/**
 * Issue Access and Refresh Tokens
 */
export const issueTokens = async (user, sessionData = {}, isTrusted = false) => {
  const accessToken = signToken(
    user._id,
    user.role,
    process.env.JWT_SECRET || 'research_connect_default_access_secret_key_2026',
    process.env.JWT_EXPIRE || '15m'
  );

  const refreshToken = signToken(
    user._id,
    user.role,
    process.env.JWT_REFRESH_SECRET || 'research_connect_default_refresh_secret_key_2026',
    process.env.JWT_REFRESH_EXPIRE || '30d'
  );

  // Save the refresh token in database (expires after 30 days)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dbRefreshToken = await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt,
  });

  const { browser, os } = parseUserAgent(sessionData.userAgent);

  // Create Session
  await Session.create({
    user: user._id,
    refreshToken,
    userAgent: sessionData.userAgent || '',
    browser,
    os,
    ipAddress: sessionData.ipAddress || '',
    location: sessionData.location || 'Unknown',
    isTrusted,
    expiresAt,
  });

  // Log successful login activity
  await LoginActivity.create({
    user: user._id,
    email: user.email,
    status: 'success',
    ipAddress: sessionData.ipAddress || '',
    userAgent: sessionData.userAgent || '',
    browser,
    os,
    location: sessionData.location || 'Unknown',
  });

  return { accessToken, refreshToken };
};

/**
 * Sign up a new researcher (sends email verification link)
 */
export const registerUser = async (userData) => {
  const { 
    firstName,
    lastName, 
    email, 
    password, 
    role,
    researcherType,
    institution,
    department,
    country,
    googleScholarId,
    orcidId,
    linkedinUrl,
    scopusId,
    researchGateUrl
  } = userData;

  // 1. Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email address already registered.', 409);
  }

  // 2. Create user (hashes password in pre-save)
  const newUser = await User.create({
    email,
    password,
    role: role || 'researcher',
    status: 'pending_verification',
    emailVerified: false,
  });

  // 3. Create researcher Profile
  const fullName = `${firstName} ${lastName}`;
  await Profile.create({
    user: newUser._id,
    firstName,
    lastName,
    researcherType: researcherType || 'academic',
    institution: institution || 'Independent Researcher',
    department: department || 'Not Specified',
    country: country || 'Not Specified',
  });

  // Create connected Academic Profile
  await AcademicProfile.create({
    user: newUser._id,
    googleScholar: googleScholarId || '',
    orcid: orcidId || '',
    linkedin: linkedinUrl || '',
    scopus: scopusId || '',
    researchGate: researchGateUrl || '',
  });

  // 4. Auto-trigger Google Scholar import if provided
  if (googleScholarId) {
    try {
      console.log(`🔍 [SCHOLAR IMPORT] Syncing Scholar ID ${googleScholarId} on signup...`);
      await scholarService.importGoogleScholarProfile(newUser._id, googleScholarId);
    } catch (err) {
      console.error('⚠️ Scholar auto-import failed during signup. Users can sync later.', err.message);
    }
  }

  // 5. Generate and Send Verification Link
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  
  await EmailVerificationToken.create({
    user: newUser._id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  await emailService.sendVerificationEmail(newUser.email, verificationToken);

  return { user: newUser };
};

/**
 * Log in researcher: check credentials, verify trusted device, generate Login OTP if not trusted
 */
export const loginUser = async (email, password, deviceId, sessionData = {}) => {
  const { browser, os } = parseUserAgent(sessionData.userAgent);

  // 1. Find user and select password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    // Log failed password login
    await LoginActivity.create({
      email,
      status: 'failed_password',
      ipAddress: sessionData.ipAddress || '',
      userAgent: sessionData.userAgent || '',
      browser,
      os,
      location: sessionData.location || 'Unknown',
      failureReason: 'Incorrect password or email',
    });
    throw new AppError('Incorrect email or password.', 401);
  }

  // 2. Check if user is blocked, suspended, or pending verification
  if (user.status === 'pending_verification') {
    throw new AppError('Please verify your email address before logging in.', 403);
  }
  if (user.status !== 'active') {
    throw new AppError('Your account has been deactivated or blocked.', 403);
  }

  // 3. Temporarily bypass OTP verification, log in immediately
  const tokens = await issueTokens(user, sessionData, false);
  return { user, otpRequired: false, ...tokens };
};

/**
 * Log in / Register with Google OAuth ID Token
 */
export const loginWithGoogle = async (idToken, sessionData = {}) => {
  if (!idToken) {
    throw new AppError('Google ID token is required.', 400);
  }

  // 1. Verify token with Google API
  const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  let payload;
  try {
    const response = await fetch(verifyUrl);
    if (!response.ok) {
      throw new AppError('Invalid Google ID token.', 401);
    }
    payload = await response.json();
  } catch (err) {
    throw new AppError(`Google verification failed: ${err.message}`, 401);
  }

  const expectedClientId = process.env.GOOGLE_CLIENT_ID;
  if (expectedClientId && payload.aud !== expectedClientId) {
    throw new AppError('Token audience mismatch.', 401);
  }

  const { sub: googleId, email, name, picture: profilePhoto } = payload;
  const nameParts = name ? name.split(' ') : ['Google', 'User'];
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // 2. Find user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    // Register new user automatically
    user = await User.create({
      email,
      password: crypto.randomBytes(16).toString('hex'), // Random password
      googleId,
      emailVerified: true,
      role: 'researcher',
      status: 'active',
    });

    // Create default profile
    await Profile.create({
      user: user._id,
      firstName,
      lastName,
      institution: 'Independent Researcher',
      department: 'Not Specified',
      researcherType: 'independent',
      country: 'Not Specified',
      avatarUrl: profilePhoto || '',
    });

    // Create default Academic Profile
    await AcademicProfile.create({
      user: user._id,
    });
  } else {
    // Link googleId if missing
    let modified = false;
    if (!user.googleId) {
      user.googleId = googleId;
      modified = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      modified = true;
    }
    if (user.status === 'pending_verification') {
      user.status = 'active';
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  }

  // 3. Issue tokens (Google OAuth bypasses OTP)
  const tokens = await issueTokens(user, sessionData, false);

  return { user, ...tokens };
};

/**
 * Verify OTP code and activate / login user
 */
export const verifyUserOTP = async (email, code, purpose, rememberDevice, sessionData = {}) => {
  const { browser, os } = parseUserAgent(sessionData.userAgent);
  
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user found with that email address.', 404);
  }

  // 1. Verify code
  try {
    await otpService.verifyOTPCode(user._id, code, purpose);
  } catch (error) {
    // Log failed OTP activity
    await LoginActivity.create({
      user: user._id,
      email: user.email,
      status: 'failed_otp',
      ipAddress: sessionData.ipAddress || '',
      userAgent: sessionData.userAgent || '',
      browser,
      os,
      location: sessionData.location || 'Unknown',
      failureReason: error.message,
    });
    throw error;
  }

  // 2. If rememberDevice is true, generate trusted device record
  let deviceId = null;
  if (rememberDevice && purpose === 'login') {
    deviceId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await TrustedDevice.create({
      user: user._id,
      deviceId,
      browser,
      os,
      ipAddress: sessionData.ipAddress || '127.0.0.1',
      expiresAt,
    });
  }

  // 3. Issue JWT tokens
  const tokens = await issueTokens(user, sessionData, !!deviceId);

  return { user, deviceId, ...tokens };
};

/**
 * Resend OTP Code
 */
export const resendUserOTP = async (email, purpose) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user found with that email address.', 404);
  }

  return await otpService.requestOTP(user, purpose);
};

/**
 * Forgot Password Request (Generates Link Token)
 */
export const requestPasswordResetLink = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // We do not throw error here to prevent email enumeration, just return.
    return;
  }

  // Delete previous reset tokens
  await PasswordResetToken.deleteMany({ user: user._id });

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await PasswordResetToken.create({
    user: user._id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
  });

  await emailService.sendForgotPasswordEmail(user.email, resetToken);
};

/**
 * Reset Password using token link
 */
export const resetPasswordWithLink = async (token, newPassword, sessionData = {}) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const resetDoc = await PasswordResetToken.findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
  });

  if (!resetDoc) {
    throw new AppError('Password reset link is invalid or has expired.', 400);
  }

  const user = await User.findById(resetDoc.user);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // 1. Update user password
  user.password = newPassword;
  await user.save();

  // 2. Clear token
  await PasswordResetToken.findByIdAndDelete(resetDoc._id);

  // 3. Invalidate all existing refresh tokens and sessions (for security)
  await RefreshToken.deleteMany({ user: user._id });
  await Session.deleteMany({ user: user._id });

  // 4. Log security event
  await SecurityLog.create({
    user: user._id,
    action: 'password_change',
    ipAddress: sessionData.ipAddress || '',
    userAgent: sessionData.userAgent || '',
    metadata: { reason: 'Password reset link used' },
  });

  // 5. Send confirmation email
  await emailService.sendPasswordChangedEmail(user.email);

  return user;
};

/**
 * Verify Email Address via Link Token
 */
export const verifyEmailWithLink = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const verificationDoc = await EmailVerificationToken.findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
  });

  if (!verificationDoc) {
    throw new AppError('Email verification link is invalid or has expired.', 400);
  }

  const user = await User.findById(verificationDoc.user);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // 1. Activate user account
  user.emailVerified = true;
  user.status = 'active';
  await user.save();

  // 2. Create profile name helper
  const profile = await Profile.findOne({ user: user._id });
  const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Researcher';

  // 3. Clean up token
  await EmailVerificationToken.findByIdAndDelete(verificationDoc._id);

  // 4. Send welcome email
  await emailService.sendWelcomeEmail(user.email, name);

  return user;
};

/**
 * Resend Verification Link
 */
export const resendVerificationLink = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user found with that email address.', 404);
  }

  if (user.emailVerified) {
    throw new AppError('Email address is already verified.', 400);
  }

  // Delete previous verification tokens
  await EmailVerificationToken.deleteMany({ user: user._id });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  
  await EmailVerificationToken.create({
    user: user._id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  await emailService.sendVerificationEmail(user.email, verificationToken);
};

/**
 * Rotate Refresh Token (RTR)
 */
export const refreshUserSession = async (oldRefreshToken, sessionData = {}) => {
  const { browser, os } = parseUserAgent(sessionData.userAgent);

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET || 'research_connect_default_refresh_secret_key_2026');

    // Find refresh token in database
    const tokenDoc = await RefreshToken.findOne({
      token: oldRefreshToken,
      user: decoded.id,
    });

    if (!tokenDoc || tokenDoc.isRevoked) {
      // Compromise detected: Token is revoked or does not exist (meaning it has already been rotated/stolen)
      // Revoke all tokens for this user immediately for security
      await RefreshToken.deleteMany({ user: decoded.id });
      await Session.deleteMany({ user: decoded.id });

      // Log critical security event
      await SecurityLog.create({
        user: decoded.id,
        action: 'all_sessions_terminated',
        ipAddress: sessionData.ipAddress || '',
        userAgent: sessionData.userAgent || '',
        metadata: { reason: 'Refresh token reuse detected (compromise alert)' },
      });

      // Send critical security alert email
      const userObj = await User.findById(decoded.id);
      if (userObj) {
        await emailService.sendSecurityAlertEmail(userObj.email, {
          reason: 'Session Hijacking Attempt Detected',
          description: 'A previously used session key was presented to our servers. To protect your account, we have logged you out of all devices and active sessions.',
        });
      }

      throw new AppError('Compromised session. Please log in again.', 401);
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      throw new AppError('User is no longer active.', 401);
    }

    // Revoke old token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // Delete old session
    await Session.findOneAndDelete({ refreshToken: oldRefreshToken });

    // Issue new tokens
    return await issueTokens(user, sessionData, false);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Session expired. Please log in again.', 401);
  }
};

/**
 * Logout User (Terminates current session)
 */
export const logoutUser = async (refreshToken) => {
  const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
  if (tokenDoc) {
    await RefreshToken.findByIdAndDelete(tokenDoc._id);
    await Session.findOneAndDelete({ refreshToken });
  }
};

/**
 * Logout User from All Devices
 */
export const logoutUserAllDevices = async (userId, sessionData = {}) => {
  await RefreshToken.deleteMany({ user: userId });
  await Session.deleteMany({ user: userId });

  await SecurityLog.create({
    user: userId,
    action: 'all_sessions_terminated',
    ipAddress: sessionData.ipAddress || '',
    userAgent: sessionData.userAgent || '',
    metadata: { reason: 'User requested logout from all devices' },
  });
};
