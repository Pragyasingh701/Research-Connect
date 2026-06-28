import * as authService from '../services/auth.service.js';
import Session from '../models/Session.js';
import TrustedDevice from '../models/TrustedDevice.js';
import LoginActivity from '../models/LoginActivity.js';
import SecurityLog from '../models/SecurityLog.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import AppError from '../utils/AppError.js';
import { validationResult } from 'express-validator';

// Helper to set refresh token secure cookie
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  res.cookie('refreshToken', token, cookieOptions);
};

// Helper to clear refresh token cookie
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

// Helper to construct sessionData from request
const getSessionData = (req) => {
  return {
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1',
    location: req.headers['x-app-location'] || 'Unknown', // Custom header or geoip lookup fallback
  };
};

/**
 * Register a new researcher
 */
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    await authService.registerUser(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. A verification link has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email using Token Link
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(new AppError('Verification token is required.', 400));
    }

    await authService.verifyEmailWithLink(token);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! Your account is now active.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Email Verification Link
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Email address is required.', 400));
    }

    await authService.resendVerificationLink(email);

    res.status(200).json({
      status: 'success',
      message: 'A new email verification link has been dispatched to your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login: check password & check trusted device
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceId = req.headers['x-device-id'] || req.cookies.deviceId;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    const sessionData = getSessionData(req);
    const result = await authService.loginUser(email, password, deviceId, sessionData);

    if (result.otpRequired) {
      const responseData = {
        status: 'success',
        otpRequired: true,
        email: result.user.email,
        message: 'A 6-digit verification code has been sent to your email.',
      };

      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        responseData.otpCode = result.code;
      }

      return res.status(200).json(responseData);
    }

    // OTP Bypassed via Trusted Device or 2FA is disabled
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      status: 'success',
      otpRequired: false,
      accessToken: result.accessToken,
      user: {
        id: result.user._id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Login OTP
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, code, purpose, rememberDevice } = req.body;

    if (!email || !code || !purpose) {
      return next(new AppError('Email, verification code, and purpose are required.', 400));
    }

    const sessionData = getSessionData(req);
    const result = await authService.verifyUserOTP(email, code, purpose, rememberDevice, sessionData);

    setRefreshTokenCookie(res, result.refreshToken);

    const responseData = {
      status: 'success',
      accessToken: result.accessToken,
      user: {
        id: result.user._id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
    };

    if (result.deviceId) {
      responseData.deviceId = result.deviceId;
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP Code
 */
export const resendOTP = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return next(new AppError('Email and purpose are required.', 400));
    }

    await authService.resendUserOTP(email, purpose);

    res.status(200).json({
      status: 'success',
      message: 'A fresh verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google Sign-In
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new AppError('Google ID token is required.', 400));
    }

    const sessionData = getSessionData(req);
    const result = await authService.loginWithGoogle(idToken, sessionData);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      status: 'success',
      accessToken: result.accessToken,
      user: {
        id: result.user._id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token Rotation (RTR)
 */
export const refreshToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
      return next(new AppError('No refresh token provided.', 401));
    }

    const sessionData = getSessionData(req);
    const result = await authService.refreshUserSession(oldRefreshToken, sessionData);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      status: 'success',
      accessToken: result.accessToken,
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

/**
 * Request Password Reset Link
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Please provide an email address.', 400));
    }

    await authService.requestPasswordResetLink(email);

    res.status(200).json({
      status: 'success',
      message: 'If the email is registered, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password using Link Token
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return next(new AppError('Token and new password are required.', 400));
    }

    const sessionData = getSessionData(req);
    await authService.resetPasswordWithLink(token, password, sessionData);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Profile
 */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await Profile.findOne({ user: user._id });

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Current Session
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await authService.logoutUser(token);
    }
    clearRefreshTokenCookie(res);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout All Sessions / Devices
 */
export const logoutAll = async (req, res, next) => {
  try {
    const sessionData = getSessionData(req);
    await authService.logoutUserAllDevices(req.user._id, sessionData);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out of all devices.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Two-Factor Authentication
 */
export const toggleTwoFactor = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return next(new AppError('Enabled status must be a boolean value.', 400));
    }

    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = enabled;
    await user.save();

    const sessionData = getSessionData(req);
    await SecurityLog.create({
      user: user._id,
      action: 'two_factor_toggle',
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      metadata: { enabled: String(enabled) },
    });

    res.status(200).json({
      status: 'success',
      message: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}.`,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Sessions
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id, expiresAt: { $gt: new Date() } })
      .sort({ lastActive: -1 });

    res.status(200).json({
      status: 'success',
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate Specific Session
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ _id: id, user: req.user._id });
    if (!session) {
      return next(new AppError('Session not found or unauthorized.', 404));
    }

    // Revoke associated RefreshToken
    await authService.logoutUser(session.refreshToken);
    
    // Delete session document
    await Session.findByIdAndDelete(id);

    const sessionData = getSessionData(req);
    await SecurityLog.create({
      user: req.user._id,
      action: 'session_terminated',
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      metadata: { sessionId: id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Session terminated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Trusted Devices
 */
export const getTrustedDevices = async (req, res, next) => {
  try {
    const devices = await TrustedDevice.find({ user: req.user._id, expiresAt: { $gt: new Date() } })
      .sort({ lastUsed: -1 });

    res.status(200).json({
      status: 'success',
      devices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke Trusted Device
 */
export const deleteTrustedDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const device = await TrustedDevice.findOneAndDelete({ _id: id, user: req.user._id });
    if (!device) {
      return next(new AppError('Trusted device not found or unauthorized.', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Trusted device revoked successfully. Next login from this device will require OTP.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Login Activity Log
 */
export const getLoginActivity = async (req, res, next) => {
  try {
    const activity = await LoginActivity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Security Audit Logs
 */
export const getSecurityLogs = async (req, res, next) => {
  try {
    const logs = await SecurityLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      logs,
    });
  } catch (error) {
    next(error);
  }
};
