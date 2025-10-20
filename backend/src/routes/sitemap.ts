import { Router } from 'express';
import sitemapController from '@/controllers/sitemapController';

const router = Router();

/**
 * Sitemap routes
 * All routes return XML format
 * These routes match exactly /sitemap*.xml pattern
 */

// Main sitemap index
router.get(/^\/sitemap\.xml$/, (req, res) => sitemapController.getSitemapIndex(req, res));

// Individual sitemaps
router.get(/^\/sitemap-static\.xml$/, (req, res) => sitemapController.getSitemapStatic(req, res));
router.get(/^\/sitemap-shops\.xml$/, (req, res) => sitemapController.getSitemapShops(req, res));
router.get(/^\/sitemap-categories\.xml$/, (req, res) => sitemapController.getSitemapCategories(req, res));
router.get(/^\/sitemap-products\.xml$/, (req, res) => sitemapController.getSitemapProducts(req, res));

// Legacy format (matching old site structure)
// Example: /sitemap-iblock-11.xml -> shops sitemap
router.get(/^\/sitemap-iblock-11\.xml$/, (req, res) => sitemapController.getLegacySitemapShops(req, res));

// You can add more legacy formats here if needed
// router.get(/^\/sitemap-iblock-12\.xml$/, (req, res) => sitemapController.getSomethingElse(req, res));

export default router;
