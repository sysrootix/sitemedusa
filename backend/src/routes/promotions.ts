import { Router } from 'express';
import promotionController from '../controllers/promotionController';

const router = Router();

// Public promotion endpoints
router.get('/', (req, res) => promotionController.list(req, res));
router.get('/active', (req, res) => promotionController.getActive(req, res));
router.get('/:id', (req, res) => promotionController.getById(req, res));

export default router;
