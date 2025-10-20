import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { QueryTypes } from 'sequelize';
import sequelize from '@/config/database';
import User from '@/models/User';
import StatusConfig from '@/models/StatusConfig';
import telegramService from '@/services/telegramService';
import jwtService from '@/services/jwtService';
import userService from '@/services/userService';
import phoneAuthService from '@/services/phoneAuthService';
import { TelegramAuthData, AuthenticatedRequest, ApiResponse } from '@/types';
import logger from '@/utils/logger';

class AuthController {
  /**
   * Telegram authentication
   */
  public async telegramAuth(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔐 Telegram Auth: Starting authentication process');
      logger.info('📥 Telegram Auth: Received request from IP:', req.ip);
      logger.info('📋 Telegram Auth: Request body:', {
        id: req.body.id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        username: req.body.username,
        photo_url: req.body.photo_url ? 'present' : 'not present',
        auth_date: req.body.auth_date,
        hash: req.body.hash ? 'present' : 'not present'
      });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('❌ Telegram Auth: Validation failed:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg),
        });
        return;
      }

      const telegramData: TelegramAuthData = req.body;
      logger.info('✅ Telegram Auth: Validation passed, processing auth data');

      // Verify Telegram auth data
      logger.info('🔍 Telegram Auth: Verifying Telegram auth data');
      if (!telegramService.verifyTelegramAuth(telegramData)) {
        logger.warn('❌ Telegram Auth: Telegram auth verification failed');
        res.status(400).json({
          success: false,
          message: 'Invalid Telegram authentication data',
          errors: ['Telegram authentication verification failed'],
        });
        return;
      }
      logger.info('✅ Telegram Auth: Telegram auth data verified successfully');

      // Check if user exists
      logger.info('👤 Telegram Auth: Checking if user exists with Telegram ID:', telegramData.id);
      let user = await userService.findByTelegramId(parseInt(telegramData.id));

      if (user) {
        logger.info('✅ Telegram Auth: Existing user found, updating info:', {
          userId: user.id,
          displayName: user.getDisplayName()
        });

        // User exists - login
        await userService.updateLastLogin(user.id);

        // Update user info from Telegram (only specific fields)
        await userService.updateUser(user.id, {
          photo_url: telegramData.photo_url || undefined,
          username: telegramData.username || undefined,
        } as any);

        user = await userService.findById(user.id);
        logger.info('🔄 Telegram Auth: User info updated');
      } else {
        logger.info('🆕 Telegram Auth: New user, creating account');

        // User doesn't exist - register
        user = await userService.createUser({
          telegram_id: parseInt(telegramData.id),
          username: telegramData.username,
          photo_url: telegramData.photo_url,
          language_code: 'ru',
        });

        logger.info('📝 Telegram Auth: New user created:', {
          userId: user?.id,
          displayName: user?.getDisplayName()
        });

        // Send welcome message
        logger.info('📨 Telegram Auth: Sending welcome message to user');
        await telegramService.sendWelcomeMessage(
          parseInt(telegramData.id),
          telegramData.username || 'Пользователь'
        );
        logger.info('✅ Telegram Auth: Welcome message sent');
      }

      if (!user) {
        throw new Error('Failed to create or retrieve user');
      }

      // Generate tokens
      logger.info('🔑 Telegram Auth: Generating JWT tokens for user:', user.id);
      const tokens = jwtService.generateTokens(user);
      logger.info('✅ Telegram Auth: Tokens generated successfully');

      // Set HTTP-only cookie
      logger.info('🍪 Telegram Auth: Setting HTTP-only cookies');
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      logger.info('✅ Telegram Auth: Cookies set successfully');

      const response: ApiResponse = {
        success: true,
        message: user ? 'Login successful' : 'Registration successful',
        data: {
          user: (user as any).toPublicJSON(),
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        },
      };

      logger.info('🎉 Telegram Auth: Authentication completed successfully');
      logger.info('📤 Telegram Auth: Sending response with user data');
      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Telegram Auth: Authentication failed with error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: 'User already exists',
            errors: [error.message],
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        errors: ['Internal server error during authentication'],
      });
    }
  }

  /**
   * Refresh token
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookies or body
      let refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token required',
          errors: ['No refresh token provided'],
        });
        return;
      }

      // Verify refresh token
      const payload = jwtService.verifyToken(refreshToken);

      // Get user
      const user = await userService.findById(payload.userId);
      if (!user || !user.is_active) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          errors: ['User not found or inactive'],
        });
        return;
      }

      // Generate new tokens
      const tokens = jwtService.generateTokens(user);

      // Set new cookies
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      if (error instanceof Error && error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          message: 'Refresh token expired',
          errors: ['Please login again'],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        errors: ['Internal server error during token refresh'],
      });
    }
  }

  /**
   * Logout
   */
  public async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        errors: ['Internal server error during logout'],
      });
    }
  }

  /**
   * Get current user profile
   */
  public async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          errors: ['Authentication required'],
        });
        return;
      }

      // Получаем пользователя с информацией о статусе
      const userWithStatus = await User.findByPk(req.user.id, {
        include: [{
          model: StatusConfig,
          as: 'statusConfig',
          required: false
        }]
      });

      if (!userWithStatus) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errors: ['User does not exist'],
        });
        return;
      }

      const userData = userWithStatus.toPublicJSON();
      
      // Добавляем информацию о конфигурации статуса
      if (userWithStatus.statusConfig) {
        (userData as any).status_config = {
          bonus_percent: userWithStatus.statusConfig.bonus_percent,
          discount_multiplier: userWithStatus.statusConfig.discount_multiplier,
          is_discount_only: userWithStatus.statusConfig.is_discount_only,
          display_name: userWithStatus.statusConfig.display_name,
          emoji: userWithStatus.statusConfig.emoji
        };
      }

      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        data: userData,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Verify token (for frontend to check if token is valid)
   */
  public async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // If we reach here, the authenticate middleware has already verified the token
      const response: ApiResponse = {
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user ? (req.user as any).toPublicJSON() : undefined,
          tokenExpiration: jwtService.getTokenExpiration(
            jwtService.extractTokenFromHeader(req.headers.authorization) || 
            req.cookies?.access_token
          ),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Check Telegram bot status
   */
  public async telegramStatus(req: Request, res: Response): Promise<void> {
    try {
      const isConfigured = await telegramService.isConfigured();
      const botInfo = await telegramService.getBotInfo();

      const response: ApiResponse = {
        success: true,
        message: 'Telegram bot status retrieved',
        data: {
          configured: isConfigured,
          bot: botInfo ? {
            id: botInfo.id,
            username: botInfo.username,
            first_name: botInfo.first_name,
          } : null,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Telegram status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Telegram status',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Send phone authentication code
   */
  public async sendPhoneAuthCode(req: Request, res: Response): Promise<void> {
    try {
      logger.info('📱 Phone Auth: Starting send code process');
      logger.info('📥 Phone Auth: Received request from IP:', req.ip);
      logger.info('📋 Phone Auth: Request body:', { phone: req.body.phone });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('❌ Phone Auth: Validation failed:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg),
        });
        return;
      }

      const { phone } = req.body;

      // Validate phone format
      if (!phoneAuthService.isValidPhone(phone)) {
        logger.warn('❌ Phone Auth: Invalid phone format:', phone);
        res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          errors: ['Phone number must be a valid Russian phone number'],
        });
        return;
      }

      // Send auth code
      logger.info('📤 Phone Auth: Sending auth code');
      const result = await phoneAuthService.sendAuthCode(phone);

      if (!result.success) {
        logger.warn('❌ Phone Auth: Failed to send auth code:', result.error);
        res.status(404).json({
          success: false,
          message: result.error || 'Failed to send authentication code',
          errors: [result.error || 'Please try again later'],
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Authentication code sent successfully',
        data: {
          sent: true,
          expiresIn: 10, // minutes
        },
      };

      logger.info('✅ Phone Auth: Code sent successfully');
      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Phone Auth: Unexpected error in sendPhoneAuthCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send authentication code',
        errors: ['Internal server error during code sending'],
      });
    }
  }

  /**
   * Get user purchase history
   */
  public async getUserPurchases(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      logger.info('📦 Getting purchase history for user:', userId);

      // Get user's normalized phone
      const user = await User.findByPk(userId);
      if (!user || !user.normalized_phone) {
        res.status(404).json({
          success: false,
          message: 'User or phone not found'
        });
        return;
      }

      logger.info('📞 User phone:', user.normalized_phone);

      // Get purchases by user_phone from purchases table
      const query = `
        SELECT
          p.id,
          p.check_id,
          p.shopname,
          p.paymaster,
          p.user_phone,
          p.time_start,
          p.time_end,
          p.total_sum,
          p.created_at,
          p.bonus_added,
          p.bonus_spent,
          p.tickets_awarded,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', pi.id,
                'name', pi.name,
                'category', pi.category,
                'price', pi.price,
                'quantity', pi.quantity,
                'bonus', pi.bonus,
                'discount', pi.discount
              )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as items
        FROM purchases p
        LEFT JOIN purchase_items pi ON p.check_id = pi.check_id
        WHERE p.user_phone = $1
        GROUP BY p.id, p.check_id, p.shopname, p.paymaster, p.user_phone,
                 p.time_start, p.time_end, p.total_sum, p.created_at,
                 p.bonus_added, p.bonus_spent, p.tickets_awarded
        ORDER BY p.created_at DESC
        LIMIT 50;
      `;

      const result = await sequelize.query(query, {
        bind: [user.normalized_phone],
        type: QueryTypes.SELECT
      });

      logger.info(`📦 Found ${result.length} purchases for user`);

      res.status(200).json({
        success: true,
        data: {
          purchases: result,
          total: result.length
        }
      });

    } catch (error) {
      logger.error('❌ Error getting user purchases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get purchase history',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get user avatar from Telegram
   */
  public async getUserAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      logger.info('📷 Getting Telegram avatar for user:', userId);

      // Get user to find telegram_chat_id
      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.telegram_id) {
        res.status(404).json({
          success: false,
          message: 'User has no Telegram ID'
        });
        return;
      }

      logger.info('🔗 User telegram_id:', user.telegram_id);

      // Get avatar from Telegram
      const avatarData = await telegramService.getUserProfilePhoto(user.telegram_id);

      if (!avatarData) {
        res.status(404).json({
          success: false,
          message: 'No avatar found for user'
        });
        return;
      }

      logger.info('✅ Successfully retrieved avatar for user');

      res.status(200).json({
        success: true,
        data: avatarData
      });

    } catch (error) {
      logger.error('❌ Error getting user avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user avatar',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Verify phone authentication code
   */
  public async verifyPhoneAuthCode(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔍 Phone Auth: Starting code verification process');
      logger.info('📥 Phone Auth: Received request from IP:', req.ip);
      logger.info('📋 Phone Auth: Request body:', { phone: req.body.phone, code: '***' });

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('❌ Phone Auth: Validation failed:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg),
        });
        return;
      }

      const { phone, code } = req.body;

      // Verify auth code
      logger.info('🔐 Phone Auth: Verifying auth code');
      const result = await phoneAuthService.verifyAuthCode(phone, code);

      if (!result.success || !result.user) {
        logger.warn('❌ Phone Auth: Code verification failed:', result.error);
        res.status(400).json({
          success: false,
          message: result.error || 'Invalid or expired authentication code',
          errors: [result.error || 'Please check your code and try again'],
        });
        return;
      }

      const user = result.user;

      // Generate tokens
      logger.info('🔑 Phone Auth: Generating JWT tokens for user:', user.id);
      const tokens = jwtService.generateTokens(user);
      logger.info('✅ Phone Auth: Tokens generated successfully');

      // Set HTTP-only cookies
      logger.info('🍪 Phone Auth: Setting HTTP-only cookies');
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      logger.info('✅ Phone Auth: Cookies set successfully');

      const response: ApiResponse = {
        success: true,
        message: 'Phone authentication successful',
        data: {
          user: (user as any).toPublicJSON(),
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        },
      };

      logger.info('🎉 Phone Auth: Authentication completed successfully');
      logger.info('📤 Phone Auth: Sending response with user data');
      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Phone Auth: Error verifying code:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        errors: ['Internal server error during authentication'],
      });
    }
  }
}

export default new AuthController();
