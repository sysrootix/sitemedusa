import { Router } from 'express';
import feedbackController from '../controllers/feedbackController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Public routes
router.post('/', (req, res) => feedbackController.create(req, res));

// Admin routes (require authentication)
router.get('/', authenticate, requireAdmin, (req, res) => feedbackController.list(req, res));
router.get('/stats', authenticate, requireAdmin, (req, res) => feedbackController.getStats(req, res));
router.get('/:id', authenticate, requireAdmin, (req, res) => feedbackController.getById(req, res));
router.patch('/:id/status', authenticate, requireAdmin, (req, res) => feedbackController.updateStatus(req, res));

export default router;
