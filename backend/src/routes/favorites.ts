import { Router } from 'express';
import favoriteController from '@/controllers/favoriteController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/favorites
 * @desc    Get all user favorites
 * @access  Private
 */
router.get('/', favoriteController.getFavorites);

/**
 * @route   POST /api/favorites
 * @desc    Add product to favorites
 * @access  Private
 */
router.post('/', favoriteController.addToFavorites);

/**
 * @route   DELETE /api/favorites/:product_id
 * @desc    Remove product from favorites
 * @access  Private
 */
router.delete('/:product_id', favoriteController.removeFromFavorites);

/**
 * @route   DELETE /api/favorites
 * @desc    Clear all favorites
 * @access  Private
 */
router.delete('/', favoriteController.clearFavorites);

/**
 * @route   GET /api/favorites/check/:product_id
 * @desc    Check if product is in favorites
 * @access  Private
 */
router.get('/check/:product_id', favoriteController.checkFavorite);

export default router;

