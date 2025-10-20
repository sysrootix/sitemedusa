import { Router } from 'express';
import shopController from '../controllers/shopController';

const router = Router();

router.get('/', (req, res) => shopController.list(req, res));
router.get('/cities', (req, res) => shopController.getCities(req, res));

export default router;


