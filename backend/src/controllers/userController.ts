import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import userService from '@/services/userService';
import { AuthenticatedRequest, ApiResponse, UserUpdateData, UserRole } from '@/types';
import logger from '@/utils/logger';

class UserController {
  /**
   * Get user profile
   */
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id || req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID required',
          errors: ['No user ID provided'],
        });
        return;
      }

      const user = await userService.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errors: ['User does not exist'],
        });
        return;
      }

      // Check permissions
      if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: ['You can only view your own profile'],
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: user.toPublicJSON(),
        },
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
   * Update user profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg),
        });
        return;
      }

      const userId = req.params.id || req.user?.id;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID required',
          errors: ['No user ID provided'],
        });
        return;
      }

      // Check permissions
      if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: ['You can only update your own profile'],
        });
        return;
      }

      const updateData: UserUpdateData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        photo_url: req.body.photo_url,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UserUpdateData] === undefined) {
          delete updateData[key as keyof UserUpdateData];
        }
      });

      const user = await userService.updateUser(userId, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toPublicJSON(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update profile error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'User not found',
            errors: [error.message],
          });
          return;
        }
        
        if (error.message.includes('already taken')) {
          res.status(409).json({
            success: false,
            message: 'Conflict',
            errors: [error.message],
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Delete user account (deactivate)
   */
  public async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id || req.user?.id;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID required',
          errors: ['No user ID provided'],
        });
        return;
      }

      // Check permissions
      if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: ['You can only delete your own account'],
        });
        return;
      }

      await userService.deactivateUser(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Account deactivated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Delete account error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errors: [error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const query = req.query.search as string;

      let users, total;

      if (query) {
        const result = await userService.searchUsers(query, limit, offset);
        users = result.users;
        total = result.total;
      } else {
        // For now, we'll implement a simple get all users
        // In a real app, you'd want proper pagination
        users = await userService.getRecentUsers(limit);
        total = users.length;
      }

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => user.toPublicJSON()),
        },
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get user statistics (admin only)
   */
  public async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();

      const response: ApiResponse = {
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Change user role (admin only)
   */
  public async changeUserRole(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg),
        });
        return;
      }

      const userId = req.params.id;
      const newRole = req.body.role as UserRole;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          errors: ['User ID must be provided'],
        });
        return;
      }

      if (!newRole || !Object.values(UserRole).includes(newRole)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
          errors: ['Role must be one of: user, moderator, admin'],
        });
        return;
      }

      const user = await userService.changeUserRole(userId, newRole);

      const response: ApiResponse = {
        success: true,
        message: 'User role changed successfully',
        data: {
          user: user.toPublicJSON(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Change user role error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errors: [error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to change user role',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Activate user (admin only)
   */
  public async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          errors: ['User ID must be provided'],
        });
        return;
      }

      const user = await userService.activateUser(userId);

      const response: ApiResponse = {
        success: true,
        message: 'User activated successfully',
        data: {
          user: user.toPublicJSON(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Activate user error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errors: [error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to activate user',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new UserController();
