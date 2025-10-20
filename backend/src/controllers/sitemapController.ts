import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '@/config/database';
import logger from '@/utils/logger';

/**
 * Sitemap Controller
 * Generates XML sitemaps for SEO
 */
class SitemapController {
  /**
   * Generate sitemap index (main sitemap file)
   */
  public async getSitemapIndex(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-shops.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-products.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating sitemap index:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate sitemap for static pages
   */
  public async getSitemapStatic(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      const staticPages = [
        { loc: '/', priority: '1.0' },
        { loc: '/catalog', priority: '0.9' },
        { loc: '/shops', priority: '0.8' },
        { loc: '/about', priority: '0.7' },
        { loc: '/contact', priority: '0.7' },
        { loc: '/articles', priority: '0.7' },
        { loc: '/vacancies', priority: '0.6' },
        { loc: '/bonus-system', priority: '0.6' },
        { loc: '/promotions', priority: '0.7' },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const page of staticPages) {
        xml += `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      }

      xml += '\n</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating static sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate sitemap for shops (like old /contacts/stores/)
   */
  public async getSitemapShops(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      // Get all shops from shop_locations
      const shops = await sequelize.query(
        `SELECT shop_code, shop_name, city, address, updated_at
         FROM shop_locations
         WHERE is_active = TRUE
         ORDER BY city, shop_name`,
        { type: QueryTypes.SELECT }
      ) as Array<{
        shop_code: string;
        shop_name: string;
        city: string;
        address: string;
        updated_at: Date;
      }>;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const shop of shops) {
        const lastmod = shop.updated_at
          ? new Date(shop.updated_at).toISOString()
          : new Date().toISOString();

        xml += `
  <url>
    <loc>${baseUrl}/shops#${shop.shop_code}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      xml += '\n</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating shops sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate sitemap for categories
   */
  public async getSitemapCategories(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      // Get all categories
      const categories = await sequelize.query(
        `SELECT id, name, full_path, updated_at
         FROM catalog_categories
         WHERE is_active = TRUE
         ORDER BY full_path`,
        { type: QueryTypes.SELECT }
      ) as Array<{
        id: string;
        name: string;
        full_path: string;
        updated_at: Date;
      }>;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const category of categories) {
        const lastmod = category.updated_at
          ? new Date(category.updated_at).toISOString()
          : new Date().toISOString();

        // Build category URL from full_path
        const categoryUrl = this.buildCategoryUrl(category.full_path);

        xml += `
  <url>
    <loc>${baseUrl}${categoryUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      xml += '\n</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating categories sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate sitemap for products
   */
  public async getSitemapProducts(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      // Get all unique products (grouped by name to avoid duplicates)
      const products = await sequelize.query(
        `SELECT
          ci.id, ci.name, ci.slug, ci.updated_at,
          cc.full_path as category_path
         FROM catalog_items ci
         LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
         WHERE ci.is_active = TRUE AND ci.slug IS NOT NULL
         GROUP BY ci.name, ci.id, ci.slug, ci.updated_at, cc.full_path
         ORDER BY ci.updated_at DESC
         LIMIT 10000`,
        { type: QueryTypes.SELECT }
      ) as Array<{
        id: string;
        name: string;
        slug: string;
        category_path: string | null;
        updated_at: Date;
      }>;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      const addedSlugs = new Set<string>(); // Track added slugs to avoid duplicates

      for (const product of products) {
        // Remove shop_code suffix from slug for sitemap
        const baseSlug = product.slug.replace(/_[A-Z0-9]+$/, '');

        // Skip if we already added this slug
        if (addedSlugs.has(baseSlug)) {
          continue;
        }
        addedSlugs.add(baseSlug);

        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString()
          : new Date().toISOString();

        // Build product URL
        const productUrl = this.buildProductUrl(baseSlug, product.category_path);

        xml += `
  <url>
    <loc>${baseUrl}${productUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`;
      }

      xml += '\n</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating products sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate legacy sitemap format (for old sitemap-iblock-11.xml style)
   * This matches the old format with /contacts/stores/ID/
   */
  public async getLegacySitemapShops(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

      const shops = await sequelize.query(
        `SELECT shop_code, shop_name, city, address, updated_at
         FROM shop_locations
         WHERE is_active = TRUE
         ORDER BY city, shop_name`,
        { type: QueryTypes.SELECT }
      ) as Array<{
        shop_code: string;
        shop_name: string;
        city: string;
        address: string;
        updated_at: Date;
      }>;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const shop of shops) {
        const lastmod = shop.updated_at
          ? new Date(shop.updated_at).toISOString()
          : new Date().toISOString();

        // Use old-style URL format for compatibility
        xml += `
  <url>
    <loc>${baseUrl}/contacts/stores/${shop.shop_code}/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
      }

      xml += '\n</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Error generating legacy shops sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Build category URL from full_path
   */
  private buildCategoryUrl(fullPath: string | null): string {
    if (!fullPath) return '/catalog';

    const slugifiedPath = fullPath
      .split('>')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => this.slugify(part))
      .join('/');

    return `/catalog/${slugifiedPath}`;
  }

  /**
   * Build product URL
   */
  private buildProductUrl(slug: string, categoryPath: string | null): string {
    const categoryUrl = this.buildCategoryUrl(categoryPath);
    return `${categoryUrl}/${slug}`;
  }

  /**
   * Simple slugify function
   */
  private slugify(text: string): string {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    return text
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }
}

export default new SitemapController();
