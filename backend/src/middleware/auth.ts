import { Request, Response, NextFunction } from 'express';
import jwtService from '@/services/jwtService';
import userService from '@/services/userService';
import { AuthenticatedRequest, UserRole } from '@/types';
import logger from '@/utils/logger';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    let token = jwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        errors: ['No authentication token provided'],
      });
      return;
    }

    // Validate token format
    if (!jwtService.isValidTokenFormat(token)) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
        errors: ['Malformed authentication token'],
      });
      return;
    }

    // Verify token
    const payload = jwtService.verifyToken(token);

    // Get user from database
    const user = await userService.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        errors: ['Invalid authentication token'],
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account deactivated',
        errors: ['Your account has been deactivated'],
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          message: 'Token expired',
          errors: ['Your session has expired. Please login again.'],
        });
        return;
      }
      
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
          errors: ['Invalid authentication token'],
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      errors: ['Internal authentication error'],
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          errors: ['You do not have permission to access this resource'],
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        errors: ['Internal authorization error'],
      });
    }
  };
};

/**
 * Middleware for admin only access
 */
export const requireAdmin = authorize([UserRole.ADMIN]);

/**
 * Middleware for moderator and admin access
 */
export const requireModerator = authorize([UserRole.MODERATOR, UserRole.ADMIN]);

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    let token = jwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    // If no token, continue without authentication
    if (!token) {
      next();
      return;
    }

    // Validate token format
    if (!jwtService.isValidTokenFormat(token)) {
      next();
      return;
    }

    try {
      // Verify token
      const payload = jwtService.verifyToken(token);

      // Get user from database
      const user = await userService.findById(payload.userId);
      if (user && user.is_active) {
        req.user = user;
      }
    } catch (tokenError) {
      // Token is invalid or expired, but we continue without auth
      logger.debug('Optional auth token validation failed:', tokenError);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    // Continue without authentication on error
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (getUserIdFromParams: (req: Request) => string | undefined) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      const resourceUserId = getUserIdFromParams(req);

      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          message: 'Invalid resource ID',
          errors: ['Resource ID is required'],
        });
        return;
      }

      // Admin can access any resource
      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // User can only access their own resources
      if (req.user.id !== resourceUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: ['You can only access your own resources'],
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Access control failed',
        errors: ['Internal access control error'],
      });
    }
  };
};

export default {
  authenticate,
  authorize,
  requireAdmin,
  requireModerator,
  optionalAuth,
  requireOwnership,
};
