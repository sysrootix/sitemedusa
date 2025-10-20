import { Request, Response } from 'express';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';
import catalogSyncService from '@/services/catalogSyncService';
import ShopLocation from '@/models/ShopLocation';
import CatalogProduct from '@/models/CatalogProduct';
import CatalogCategory from '@/models/CatalogCategory';
import CatalogItem from '@/models/CatalogItem';
import CatalogExclusion from '@/models/CatalogExclusion';
import CatalogSyncLog from '@/models/CatalogSyncLog';
import { Op, Sequelize } from 'sequelize';
import sequelize from '@/config/database';
import { QueryTypes } from 'sequelize';

/**
 * Controller for managing catalog shops and synchronization
 */
class CatalogShopsController {
  /**
   * Get all active shops with catalog data
   */
  public async getShops(req: Request, res: Response): Promise<void> {
    try {
      const { city } = req.query;

      const where: any = { is_active: true };
      if (city) {
        where.city = city;
      }

      const shops = await ShopLocation.findAll({
        where,
        attributes: [
          'shop_code',
          'shop_name',
          'address',
          'city',
          'description',
          'phone',
          'working_hours',
          'latitude',
          'longitude',
          'twogis_url',
          'yandex_maps_url',
          'google_maps_url',
          'priority_order',
        ],
        order: [
          ['city', 'ASC'],
          ['priority_order', 'ASC'],
          ['shop_name', 'ASC'],
        ],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Shops retrieved successfully',
        data: { shops },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching shops:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shops',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get shop catalog with categories and products
   */
  public async getShopCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode } = req.params;

      // Check if shop exists
      const shop = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: 'Shop not found',
          errors: ['Shop not found or inactive'],
        });
        return;
      }

      // Get all products for this shop
      const products = await CatalogProduct.findAll({
        where: {
          shop_code: shopCode,
          is_active: true,
        },
        attributes: [
          'id',
          'name',
          'category_name',
          'category_id',
          'retail_price',
          'quanty',
          'characteristics',
          'modifications',
          'last_updated',
        ],
        order: [
          ['category_name', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      // Group products by category
      const categoriesMap = new Map<string, any>();
      
      products.forEach((product) => {
        const categoryName = product.category_name || 'Без категории';
        
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            id: product.category_id,
            name: categoryName,
            products: [],
          });
        }
        
        categoriesMap.get(categoryName)!.products.push(product);
      });

      const categories = Array.from(categoriesMap.values());

      const response: ApiResponse = {
        success: true,
        message: 'Shop catalog retrieved successfully',
        data: {
          shop: {
            shop_code: shop.shop_code,
            shop_name: shop.shop_name,
            address: shop.address,
            city: shop.city,
          },
          categories,
          total_products: products.length,
          total_categories: categories.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching shop catalog:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shop catalog',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Search products across all shops
   */
  public async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const { q, shop_code, limit = '20' } = req.query;

      if (!q || (q as string).trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          errors: ['Invalid search query'],
        });
        return;
      }

      const searchQuery = (q as string).trim();
      const where: any = {
        is_active: true,
        name: { [Op.iLike]: `%${searchQuery}%` },
      };

      if (shop_code) {
        where.shop_code = shop_code;
      }

      const products = await CatalogProduct.findAll({
        where,
        attributes: [
          'id',
          'name',
          'category_name',
          'retail_price',
          'quanty',
          'shop_code',
          'shop_name',
          'modifications',
        ],
        limit: parseInt(limit as string),
        order: [['name', 'ASC']],
      });

      // Group products by name to show availability across shops
      const productMap = new Map<string, any>();
      
      products.forEach((product) => {
        if (!productMap.has(product.name)) {
          productMap.set(product.name, {
            id: product.id,
            name: product.name,
            category_name: product.category_name,
            modifications: product.modifications,
            shops: [],
          });
        }
        
        productMap.get(product.name)!.shops.push({
          shop_code: product.shop_code,
          shop_name: product.shop_name,
          quantity: product.quanty,
          price: product.retail_price,
        });
      });

      const groupedProducts = Array.from(productMap.values());

      const response: ApiResponse = {
        success: true,
        message: 'Search completed successfully',
        data: {
          products: groupedProducts,
          total: groupedProducts.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Manually trigger catalog sync for a shop
   */
  public async syncShopCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode } = req.params;

      if (!shopCode) {
        res.status(400).json({
          success: false,
          message: 'Shop code is required',
          errors: ['Shop code parameter is missing'],
        });
        return;
      }

      logger.info(`🔄 Manual catalog sync requested for shop ${shopCode}`);

      // Trigger sync in background
      catalogSyncService.syncShopCatalog(shopCode).then((result) => {
        if (result.success) {
          logger.info(`✅ Manual sync completed for shop ${shopCode}`);
        } else {
          logger.error(`❌ Manual sync failed for shop ${shopCode}: ${result.error}`);
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Catalog sync started',
        data: {
          shop_code: shopCode,
          status: 'started',
        },
      };

      res.status(202).json(response); // 202 Accepted
    } catch (error) {
      logger.error('❌ Error triggering catalog sync:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger catalog sync',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Sync all shop catalogs
   */
  public async syncAllShops(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔄 Manual sync requested for all shops');

      // Trigger sync in background
      catalogSyncService.syncAllShops().then((results) => {
        const successful = results.filter((r) => r.success).length;
        const failed = results.length - successful;
        logger.info(`✅ Sync completed: ${successful} successful, ${failed} failed`);
      });

      const response: ApiResponse = {
        success: true,
        message: 'Catalog sync started for all shops',
        data: {
          status: 'started',
        },
      };

      res.status(202).json(response); // 202 Accepted
    } catch (error) {
      logger.error('❌ Error triggering sync for all shops:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger sync',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get sync status and logs
   */
  public async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { shop_code, limit = '10' } = req.query;

      const where: any = {};
      if (shop_code) {
        where.shop_code = shop_code;
      }

      const logs = await CatalogSyncLog.findAll({
        where,
        limit: parseInt(limit as string),
        order: [['started_at', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Sync logs retrieved successfully',
        data: { logs },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching sync logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync logs',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Manage catalog exclusions
   */
  public async addExclusion(req: Request, res: Response): Promise<void> {
    try {
      const { exclusion_type, item_id, reason } = req.body;

      if (!exclusion_type || !item_id) {
        res.status(400).json({
          success: false,
          message: 'exclusion_type and item_id are required',
          errors: ['Missing required fields'],
        });
        return;
      }

      if (!['product', 'category'].includes(exclusion_type)) {
        res.status(400).json({
          success: false,
          message: 'exclusion_type must be either "product" or "category"',
          errors: ['Invalid exclusion_type'],
        });
        return;
      }

      const exclusion = await CatalogExclusion.create({
        exclusion_type,
        item_id,
        reason,
        created_by: ((req as any).user as any)?.telegram_id || null,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Exclusion added successfully',
        data: { exclusion },
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({
          success: false,
          message: 'Exclusion already exists',
          errors: ['Duplicate exclusion'],
        });
        return;
      }

      logger.error('❌ Error adding exclusion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add exclusion',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get all exclusions
   */
  public async getExclusions(req: Request, res: Response): Promise<void> {
    try {
      const exclusions = await CatalogExclusion.findAll({
        where: { is_active: true },
        order: [
          ['exclusion_type', 'ASC'],
          ['created_at', 'DESC'],
        ],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Exclusions retrieved successfully',
        data: { exclusions },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching exclusions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exclusions',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Delete exclusion
   */
  public async deleteExclusion(req: Request, res: Response): Promise<void> {
    try {
      const { exclusionId } = req.params;

      const exclusion = await CatalogExclusion.findByPk(exclusionId);

      if (!exclusion) {
        res.status(404).json({
          success: false,
          message: 'Exclusion not found',
          errors: ['Exclusion not found'],
        });
        return;
      }

      await exclusion.update({ is_active: false });

      const response: ApiResponse = {
        success: true,
        message: 'Exclusion deleted successfully',
        data: { exclusion },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error deleting exclusion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exclusion',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get categories tree for a shop
   */
  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode } = req.params;
      const { parent_id } = req.query;

      // Check if shop exists
      const shop = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: 'Shop not found',
          errors: ['Shop not found or inactive'],
        });
        return;
      }

      // Get categories
      const where: any = {
        shop_code: shopCode,
        is_active: true,
      };

      // If parent_id is provided, get subcategories; otherwise get root categories
      if (parent_id === 'null' || parent_id === '' || !parent_id) {
        where.parent_id = null;
      } else {
        where.parent_id = parent_id as string;
      }

      const categories = await CatalogCategory.findAll({
        where,
        order: [
          ['sort_order', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      // For each category, get products count and subcategories count
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const categoryData = category.toJSON();

          // Count products in this category
          const productsCount = await CatalogItem.count({
            where: {
              category_id: categoryData.id,
              shop_code: shopCode,
              is_active: true,
            },
          });

          // Count subcategories
          const subcategoriesCount = await CatalogCategory.count({
            where: {
              parent_id: categoryData.id,
              shop_code: shopCode,
              is_active: true,
            },
          });

          return {
            ...categoryData,
            products_count: productsCount,
            subcategories_count: subcategoriesCount,
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories: categoriesWithCounts, shop },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get products in a category
   */
  public async getCategoryProducts(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode, categoryId } = req.params;
      const { page = 1, limit = 50, sort = 'name', order = 'ASC' } = req.query;

      // Check if shop exists
      const shop = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: 'Shop not found',
          errors: ['Shop not found or inactive'],
        });
        return;
      }

      // Check if category exists
      const category = await CatalogCategory.findOne({
        where: {
          id: categoryId,
          shop_code: shopCode,
          is_active: true,
        },
      });

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category not found or inactive'],
        });
        return;
      }

      // Calculate pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Get products
      const { rows: products, count: total } = await CatalogItem.findAndCountAll({
        where: {
          category_id: categoryId,
          shop_code: shopCode,
          is_active: true,
        },
        order: [[sort as string, order as string]],
        limit: limitNum,
        offset,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products,
          category,
          shop,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching category products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get full category tree for a shop
   */
  public async getCategoryTree(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode } = req.params;

      // Check if shop exists
      const shop = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: 'Shop not found',
          errors: ['Shop not found or inactive'],
        });
        return;
      }

      // Get category tree using recursive CTE
      const categoryTree = await sequelize.query(
        `
        WITH RECURSIVE category_tree AS (
          -- Base case: root categories
          SELECT 
            id, shop_code, name, parent_id, level, full_path, quanty, 
            is_active, sort_order, created_at, updated_at,
            ARRAY[id] as path_ids,
            (SELECT COUNT(*) FROM catalog_items WHERE category_id = catalog_categories.id AND shop_code = catalog_categories.shop_code AND is_active = TRUE) as products_count
          FROM catalog_categories
          WHERE shop_code = :shopCode AND parent_id IS NULL AND is_active = TRUE
          
          UNION ALL
          
          -- Recursive case: child categories
          SELECT 
            c.id, c.shop_code, c.name, c.parent_id, c.level, c.full_path, c.quanty,
            c.is_active, c.sort_order, c.created_at, c.updated_at,
            ct.path_ids || c.id,
            (SELECT COUNT(*) FROM catalog_items WHERE category_id = c.id AND shop_code = c.shop_code AND is_active = TRUE) as products_count
          FROM catalog_categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id AND c.shop_code = ct.shop_code
          WHERE c.is_active = TRUE
        )
        SELECT * FROM category_tree
        ORDER BY level, sort_order, name
        `,
        {
          replacements: { shopCode },
          type: QueryTypes.SELECT,
        }
      );

      const response: ApiResponse = {
        success: true,
        message: 'Category tree retrieved successfully',
        data: { tree: categoryTree, shop },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching category tree:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category tree',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get breadcrumb path for a category
   */
  public async getCategoryBreadcrumbs(req: Request, res: Response): Promise<void> {
    try {
      const { shopCode, categoryId } = req.params;

      // Check if shop exists
      const shop = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: 'Shop not found',
          errors: ['Shop not found or inactive'],
        });
        return;
      }

      // Get breadcrumb path using recursive query
      const breadcrumbs = await sequelize.query(
        `
        WITH RECURSIVE breadcrumb_path AS (
          -- Start from the target category
          SELECT id, shop_code, name, parent_id, level, 0 as depth
          FROM catalog_categories
          WHERE id = :categoryId AND shop_code = :shopCode AND is_active = TRUE
          
          UNION ALL
          
          -- Get parent categories
          SELECT c.id, c.shop_code, c.name, c.parent_id, c.level, bp.depth + 1
          FROM catalog_categories c
          INNER JOIN breadcrumb_path bp ON c.id = bp.parent_id AND c.shop_code = bp.shop_code
          WHERE c.is_active = TRUE
        )
        SELECT * FROM breadcrumb_path
        ORDER BY depth DESC
        `,
        {
          replacements: { categoryId, shopCode },
          type: QueryTypes.SELECT,
        }
      );

      if (breadcrumbs.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category not found or inactive'],
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Breadcrumbs retrieved successfully',
        data: { breadcrumbs, shop },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching breadcrumbs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breadcrumbs',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new CatalogShopsController();

