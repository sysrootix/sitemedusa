import { Router } from 'express';
import articleController from '../controllers/articleController';

const router = Router();

// Public articles endpoints
router.get('/', (req, res) => articleController.list(req, res));
router.get('/:slug', (req, res) => articleController.detail(req, res));

export default router;


