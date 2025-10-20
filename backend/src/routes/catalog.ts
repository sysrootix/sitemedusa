import { Router } from 'express';
import catalogController from '../controllers/catalogController';

const router = Router();

// Get products with filtering, sorting and pagination
router.get('/', (req, res) => catalogController.getProducts(req, res));

// Get available shops
router.get('/shops', (req, res) => catalogController.getAvailableShops(req, res));

// Get product categories (old method - for backward compatibility)
router.get('/categories', (req, res) => catalogController.getCategories(req, res));

// Get hierarchical categories (new method)
router.get('/categories/hierarchy', (req, res) => catalogController.getHierarchicalCategories(req, res));

// Get category by ID with breadcrumb
router.get('/categories/:id', (req, res) => catalogController.getCategoryById(req, res));

// Get products by category ID
router.get('/categories/:categoryId/products', (req, res) => catalogController.getProductsByCategoryId(req, res));

// Search products
router.get('/search', (req, res) => catalogController.searchProducts(req, res));

// Global product search with pagination and filters
router.get('/products/search', (req, res) => catalogController.searchProductsGlobally(req, res));

// Get product by slug (SEO-friendly URL)
router.get('/products/slug/:slug', (req, res) => catalogController.getProductBySlug(req, res));

// Get product by ID with variants
router.get('/products/:id', (req, res) => catalogController.getProductById(req, res));

// Get popular products based on sales data
router.get('/products/popular/top', (req, res) => catalogController.getPopularProducts(req, res));

export default router;
