import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateSignup } from '../validations/user.validation.js';
import { rateLimiter } from '../middleware/security.middleware.js';

const router = express.Router();

// Strict rate limiter for sensitive authentication endpoints
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 requests per 15 minutes
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

// Public auth endpoints
router.post('/register', authLimiter, validateSignup, authController.register);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);

router.post('/login', authLimiter, authController.login);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/resend-otp', authLimiter, authController.resendOTP);

router.post('/google', authController.googleLogin);
router.post('/google-login', authController.googleLogin); // Alias for compatibility

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetUserPassword);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected endpoints
router.use(protect);

router.get('/me', authController.getMe);
router.post('/logout-all', authController.logoutAll);
router.post('/two-factor', authController.toggleTwoFactor);

router.get('/sessions', authController.getSessions);
router.delete('/sessions/:id', authController.deleteSession);

router.get('/trusted-devices', authController.getTrustedDevices);
router.delete('/trusted-devices/:id', authController.deleteTrustedDevice);

router.get('/login-activity', authController.getLoginActivity);
router.get('/security-logs', authController.getSecurityLogs);

export default router;
