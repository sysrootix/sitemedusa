import { Router } from 'express';
import userController from '@/controllers/userController';
import { authenticate, requireAdmin, requireOwnership } from '@/middleware/auth';
import { 
  validateUserId,
  validateProfileUpdate,
  validateRoleChange,
  validatePagination
} from '@/utils/validators';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validatePagination,
  userController.getAllUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  userController.getUserStats
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile
 * @access  Private (Own profile or Admin)
 */
router.get(
  '/:id',
  authenticate,
  validateUserId,
  requireOwnership((req) => req.params.id),
  userController.getProfile
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Own profile or Admin)
 */
router.put(
  '/:id',
  authenticate,
  validateUserId,
  validateProfileUpdate,
  requireOwnership((req) => req.params.id),
  userController.updateProfile
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account (deactivate)
 * @access  Private (Own profile or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  validateUserId,
  requireOwnership((req) => req.params.id),
  userController.deleteAccount
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change user role (admin only)
 * @access  Private (Admin)
 */
router.patch(
  '/:id/role',
  authenticate,
  requireAdmin,
  validateRoleChange,
  userController.changeUserRole
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user (admin only)
 * @access  Private (Admin)
 */
router.patch(
  '/:id/activate',
  authenticate,
  requireAdmin,
  validateUserId,
  userController.activateUser
);

export default router;
