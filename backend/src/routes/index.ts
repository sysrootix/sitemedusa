import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import { healthCheck } from '@/middleware';
import articleRoutes from './articles';
import shopRoutes from './shops';
import mapRoutes from './maps';
import homeBlocksRoutes from './homeBlocks';
import feedbackRoutes from './feedback';
import vacancyRoutes from './vacancies';
import promotionRoutes from './promotions';
import catalogRoutes from './catalog';
import catalogShopsRoutes from './catalogShops';
import cartRoutes from './cart';
import favoritesRoutes from './favorites';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/shops', shopRoutes);
router.use('/maps', mapRoutes);
router.use('/home', homeBlocksRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/vacancies', vacancyRoutes);
router.use('/promotions', promotionRoutes);
router.use('/catalog', catalogRoutes);
router.use('/catalog-shops', catalogShopsRoutes);
router.use('/cart', cartRoutes);
router.use('/favorites', favoritesRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medusa Vape Shop API',
    data: {
      name: 'Medusa Vape Shop API',
      version: '1.0.0',
      description: 'Backend API for Medusa Vape Shop with Telegram authentication',
      endpoints: {
        auth: {
          'POST /api/auth/telegram': 'Authenticate with Telegram',
          'POST /api/auth/phone/send-code': 'Send phone authentication code',
          'POST /api/auth/phone/verify-code': 'Verify phone authentication code',
          'POST /api/auth/refresh': 'Refresh access token',
          'POST /api/auth/logout': 'Logout user',
          'GET /api/auth/me': 'Get current user profile',
          'GET /api/auth/verify': 'Verify token validity',
          'GET /api/auth/telegram/status': 'Check Telegram bot status',
        },
        users: {
          'GET /api/users': 'Get all users (admin)',
          'GET /api/users/stats': 'Get user statistics (admin)',
          'GET /api/users/:id': 'Get user profile',
          'PUT /api/users/:id': 'Update user profile',
          'DELETE /api/users/:id': 'Delete user account',
          'PATCH /api/users/:id/role': 'Change user role (admin)',
          'PATCH /api/users/:id/activate': 'Activate user (admin)',
        },
        articles: {
          'GET /api/articles': 'List published articles',
          'GET /api/articles/:slug': 'Get article by slug',
        },
        shops: {
          'GET /api/shops': 'List active shops',
          'GET /api/shops/cities': 'Get list of cities with shops',
        },
        maps: {
          'GET /api/maps/static': 'Get static map image',
          'GET /api/maps/geocode': 'Geocode coordinates to address',
          'GET /api/maps/js-api': 'Proxy for Yandex Maps JavaScript API',
        },
        home: {
          'GET /api/home/blocks': 'Get home page blocks configuration',
          'PUT /api/home/blocks': 'Update home page blocks configuration',
          'PATCH /api/home/blocks/:blockId/toggle': 'Toggle block visibility',
          'PATCH /api/home/blocks/:blockId/order': 'Update block order',
          'POST /api/home/blocks/reset': 'Reset blocks configuration to default',
        },
        feedback: {
          'POST /api/feedback': 'Submit feedback from contact form',
          'GET /api/feedback': 'List all feedback (admin)',
          'GET /api/feedback/stats': 'Get feedback statistics (admin)',
          'GET /api/feedback/:id': 'Get feedback by ID (admin)',
          'PATCH /api/feedback/:id/status': 'Update feedback status (admin)',
        },
        vacancies: {
          'GET /api/vacancies': 'List all vacancies',
          'GET /api/vacancies/:id': 'Get vacancy by ID',
          'POST /api/vacancies/responses': 'Submit response to vacancy',
        },
        promotions: {
          'GET /api/promotions': 'List all promotions with pagination',
          'GET /api/promotions/active': 'Get active promotions',
          'GET /api/promotions/:id': 'Get promotion by ID',
        },
        catalog: {
          'GET /api/catalog': 'List products with filtering, sorting and pagination',
          'GET /api/catalog/categories': 'Get product categories',
          'GET /api/catalog/search': 'Search products',
          'GET /api/catalog/:id': 'Get product details with shop variants',
        },
        cart: {
          'GET /api/cart': 'Get user cart items',
          'POST /api/cart': 'Add item to cart',
          'PATCH /api/cart/:id': 'Update cart item quantity',
          'DELETE /api/cart/:id': 'Remove item from cart',
          'DELETE /api/cart': 'Clear entire cart',
        },
        favorites: {
          'GET /api/favorites': 'Get all user favorites',
          'POST /api/favorites': 'Add product to favorites',
          'DELETE /api/favorites/:product_id': 'Remove product from favorites',
          'DELETE /api/favorites': 'Clear all favorites',
          'GET /api/favorites/check/:product_id': 'Check if product is in favorites',
        },
        'catalog-shops': {
          'GET /api/catalog-shops/shops': 'List all shops with catalog data',
          'GET /api/catalog-shops/shops/:shopCode/catalog': 'Get full catalog for a shop',
          'GET /api/catalog-shops/search': 'Search products across all shops',
          'POST /api/catalog-shops/shops/:shopCode/sync': 'Trigger catalog sync for a shop (admin)',
          'POST /api/catalog-shops/sync-all': 'Trigger catalog sync for all shops (admin)',
          'GET /api/catalog-shops/sync-status': 'Get sync logs and status (admin)',
          'GET /api/catalog-shops/exclusions': 'List catalog exclusions (admin)',
          'POST /api/catalog-shops/exclusions': 'Add catalog exclusion (admin)',
          'DELETE /api/catalog-shops/exclusions/:exclusionId': 'Remove catalog exclusion (admin)',
        },
        system: {
          'GET /api/health': 'Health check',
          'GET /api/': 'API information',
        },
      },
      documentation: 'https://github.com/medusa-vape-shop/api-docs',
      support: 'support@medusa-vape.ru',
    },
  });
});

export default router;
