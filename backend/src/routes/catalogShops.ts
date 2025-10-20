import { Router } from 'express';
import catalogShopsController from '../controllers/catalogShopsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes - Catalog browsing
router.get('/shops', (req, res) => catalogShopsController.getShops(req, res));
router.get('/shops/:shopCode/catalog', (req, res) => catalogShopsController.getShopCatalog(req, res));
router.get('/search', (req, res) => catalogShopsController.searchProducts(req, res));

// Public routes - Category browsing (new structure)
router.get('/shops/:shopCode/categories', (req, res) => catalogShopsController.getCategories(req, res));
router.get('/shops/:shopCode/categories/tree', (req, res) => catalogShopsController.getCategoryTree(req, res));
router.get('/shops/:shopCode/categories/:categoryId/products', (req, res) => catalogShopsController.getCategoryProducts(req, res));
router.get('/shops/:shopCode/categories/:categoryId/breadcrumbs', (req, res) => catalogShopsController.getCategoryBreadcrumbs(req, res));

// Protected routes - Sync management (require authentication)
router.post('/shops/:shopCode/sync', authenticate, (req, res) => catalogShopsController.syncShopCatalog(req, res));
router.post('/sync-all', authenticate, (req, res) => catalogShopsController.syncAllShops(req, res));
router.get('/sync-status', authenticate, (req, res) => catalogShopsController.getSyncStatus(req, res));

// Protected routes - Exclusions management
router.get('/exclusions', authenticate, (req, res) => catalogShopsController.getExclusions(req, res));
router.post('/exclusions', authenticate, (req, res) => catalogShopsController.addExclusion(req, res));
router.delete('/exclusions/:exclusionId', authenticate, (req, res) => catalogShopsController.deleteExclusion(req, res));

export default router;

