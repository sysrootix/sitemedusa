import { Router } from 'express';
import vacancyController from '../controllers/vacancyController';

const router = Router();

// Public routes
router.get('/', (req, res) => vacancyController.VacancyController.list(req, res));
router.get('/:id', (req, res) => vacancyController.VacancyController.getById(req, res));

// Vacancy responses
router.post('/responses', (req, res) => vacancyController.VacancyResponseController.create(req, res));

// Admin routes (require authentication) - commented out for now
// router.get('/responses', authenticate, requireAdmin, (req, res) => vacancyController.VacancyResponseController.list(req, res));

export default router;
