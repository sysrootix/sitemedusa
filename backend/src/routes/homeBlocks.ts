import { Router } from 'express';
import homeBlocksController from '@/controllers/homeBlocksController';
import { authenticate } from '@/middleware/auth';

const router = Router();

/**
 * @route GET /api/home/blocks
 * @desc Получить конфигурацию блоков главной страницы
 * @access Public (пока что, в будущем можно добавить аутентификацию для админов)
 */
router.get('/blocks', homeBlocksController.getBlocksConfig);

/**
 * @route PUT /api/home/blocks
 * @desc Обновить конфигурацию блоков главной страницы
 * @access Private (только админы)
 */
router.put('/blocks', authenticate, homeBlocksController.updateBlocksConfig);

/**
 * @route PATCH /api/home/blocks/:blockId/toggle
 * @desc Включить/отключить блок
 * @access Private (только админы)
 */
router.patch('/blocks/:blockId/toggle', authenticate, homeBlocksController.toggleBlock);

/**
 * @route PATCH /api/home/blocks/:blockId/order
 * @desc Изменить порядок блока
 * @access Private (только админы)
 */
router.patch('/blocks/:blockId/order', authenticate, homeBlocksController.updateBlockOrder);

/**
 * @route POST /api/home/blocks/reset
 * @desc Сбросить конфигурацию к значениям по умолчанию
 * @access Private (только админы)
 */
router.post('/blocks/reset', authenticate, homeBlocksController.resetToDefault);

export default router;
