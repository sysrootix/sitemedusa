import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '@/types';
import FavoriteItem from '@/models/FavoriteItem';
import logger from '@/utils/logger';

class FavoriteController {
  /**
   * Get all user favorites
   */
  public async getFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const favorites = await FavoriteItem.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Favorites retrieved successfully',
        data: {
          items: favorites,
          count: favorites.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting favorites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorites',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Add product to favorites
   */
  public async addToFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { product_id, product_name, product_data } = req.body;

      if (!product_id || !product_name) {
        res.status(400).json({
          success: false,
          message: 'Product ID and name are required',
        });
        return;
      }

      // Check if already in favorites
      const existing = await FavoriteItem.findOne({
        where: {
          user_id: userId,
          product_id,
        },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: 'Product already in favorites',
        });
        return;
      }

      // Add to favorites
      const favorite = await FavoriteItem.create({
        user_id: userId,
        product_id,
        product_name,
        product_data: product_data || {},
      });

      const response: ApiResponse = {
        success: true,
        message: 'Product added to favorites',
        data: {
          item: favorite,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error adding to favorites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add to favorites',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Remove product from favorites
   */
  public async removeFromFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { product_id } = req.params;

      if (!product_id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const deleted = await FavoriteItem.destroy({
        where: {
          user_id: userId,
          product_id,
        },
      });

      if (deleted === 0) {
        res.status(404).json({
          success: false,
          message: 'Product not found in favorites',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Product removed from favorites',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error removing from favorites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove from favorites',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Clear all favorites
   */
  public async clearFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await FavoriteItem.destroy({
        where: {
          user_id: userId,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Favorites cleared successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error clearing favorites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear favorites',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Check if product is in favorites
   */
  public async checkFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { product_id } = req.params;

      if (!product_id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const favorite = await FavoriteItem.findOne({
        where: {
          user_id: userId,
          product_id,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Favorite status checked',
        data: {
          is_favorite: !!favorite,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error checking favorite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check favorite status',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new FavoriteController();

