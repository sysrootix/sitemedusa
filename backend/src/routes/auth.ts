import { Router } from 'express';
import authController from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { authRateLimiter } from '@/middleware';
import {
  validateTelegramAuth,
  validateRefreshToken,
  validatePhoneAuth,
  validatePhoneCode
} from '@/utils/validators';

const router = Router();

/**
 * @route   POST /api/auth/telegram
 * @desc    Authenticate user with Telegram
 * @access  Public
 */
router.post(
  '/telegram',
  authRateLimiter,
  validateTelegramAuth,
  authController.telegramAuth
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  authRateLimiter,
  validateRefreshToken,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.me
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  authController.verifyToken
);

/**
 * @route   GET /api/auth/telegram/status
 * @desc    Check Telegram bot status
 * @access  Public
 */
router.get(
  '/telegram/status',
  authController.telegramStatus
);

/**
 * @route   POST /api/auth/phone/send-code
 * @desc    Send phone authentication code
 * @access  Public
 */
router.post(
  '/phone/send-code',
  authRateLimiter,
  validatePhoneAuth,
  authController.sendPhoneAuthCode
);

/**
 * @route   POST /api/auth/phone/verify-code
 * @desc    Verify phone authentication code
 * @access  Public
 */
router.post(
  '/phone/verify-code',
  authRateLimiter,
  validatePhoneCode,
  authController.verifyPhoneAuthCode
);

/**
 * @route   GET /api/auth/purchases
 * @desc    Get user purchase history
 * @access  Private
 */
router.get(
  '/purchases',
  authenticate,
  authController.getUserPurchases
);

/**
 * @route   GET /api/auth/avatar
 * @desc    Get user avatar from Telegram
 * @access  Private
 */
router.get(
  '/avatar',
  authenticate,
  authController.getUserAvatar
);

export default router;
