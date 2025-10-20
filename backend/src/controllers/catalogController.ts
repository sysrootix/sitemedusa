import { Request, Response } from 'express';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '@/config/database';
import CatalogProduct from '@/models/CatalogProduct';
import CatalogCategory from '@/models/CatalogCategory';
import CatalogItem from '@/models/CatalogItem';
import CatalogExclusion from '@/models/CatalogExclusion';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';
import { getSearchVariants } from '@/utils/keyboardLayout';

interface CatalogFilters {
  category?: string;
  shop?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface CatalogSort {
  field: 'name' | 'price' | 'created_at' | 'popularity';
  order: 'asc' | 'desc';
}

class CatalogController {
  /**
   * Get list of excluded item IDs
   */
  private async getExcludedItemIds(): Promise<string[]> {
    try {
      const exclusions = await CatalogExclusion.findAll({
        where: {
          is_active: true
        },
        attributes: ['item_id']
      });
      return exclusions.map(e => e.item_id);
    } catch (error) {
      logger.error('Error fetching catalog exclusions:', error);
      return [];
    }
  }
  public async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Parse filters
      const filters: CatalogFilters = {};
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.shop) filters.shop = req.query.shop as string;
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
      if (req.query.inStock === 'true') filters.inStock = true;

      // Parse sorting
      const sort: CatalogSort = {
        field: (req.query.sortBy as CatalogSort['field']) || 'name',
        order: (req.query.sortOrder as CatalogSort['order']) || 'asc'
      };

      // Get excluded item IDs
      const excludedIds = await this.getExcludedItemIds();

      // Build where conditions
      const where: any = { is_active: true };

      // Exclude items from exclusions table
      if (excludedIds.length > 0) {
        where.id = { [Op.notIn]: excludedIds };
      }

      if (filters.category) {
        where.category_name = { [Op.iLike]: `%${filters.category}%` };
      }

      if (filters.shop) {
        where.shop_code = filters.shop;
      }

      if (filters.search) {
        where.name = { [Op.iLike]: `%${filters.search}%` };
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.retail_price = {};
        if (filters.minPrice !== undefined) {
          where.retail_price[Op.gte] = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          where.retail_price[Op.lte] = filters.maxPrice;
        }
      }

      if (filters.inStock) {
        where.quanty = { [Op.gt]: 0 };
      }

      // Build order conditions
      let order: any[] = [];
      switch (sort.field) {
        case 'name':
          order = [['name', sort.order]];
          break;
        case 'price':
          order = [['retail_price', sort.order]];
          break;
        case 'created_at':
          order = [['created_at', sort.order]];
          break;
        default:
          order = [['name', 'asc']];
      }

      // Get products with pagination
      const { count, rows: products } = await CatalogProduct.findAndCountAll({
        where,
        order,
        limit,
        offset,
        attributes: [
          'id', 'name', 'category_name', 'retail_price', 'quanty',
          'characteristics', 'modifications', 'shop_name', 'shop_code',
          'created_at', 'last_updated'
        ]
      });

      // Group products by name to show availability across shops
      const groupedProducts = this.groupProductsByName(products);

      const response: ApiResponse = {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products: groupedProducts,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        errors: ['Internal server error'],
      });
    }
  }

  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CatalogProduct.findAll({
        where: {
          is_active: true,
          category_name: { [Op.not]: null }
        },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('category_name')), 'category_name'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'product_count']
        ],
        group: ['category_name'],
        raw: true,
      });

      const categoryList = categories
        .map((item: any) => ({
          name: item.category_name,
          count: parseInt(item.product_count)
        }))
        .filter((cat: any) => cat.name && cat.name.trim() !== '')
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      const response: ApiResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories: categoryList },
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

  public async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // First, try to find in catalog_items (new structure)
      const item = await CatalogItem.findOne({
        where: { id, is_active: true },
        attributes: [
          'id', 'shop_code', 'category_id', 'name', 'slug',
          'quanty', 'retail_price', 'characteristics', 'modifications'
        ]
      });

      if (item) {
        // Get all shops where this product is available (by name) with shop details and modifications
        const allShops = await sequelize.query(
          `SELECT 
            ci.id, ci.shop_code, ci.quanty, ci.retail_price,
            ci.modifications,
            sl.shop_name, sl.city, sl.address
           FROM catalog_items ci
           LEFT JOIN shop_locations sl ON ci.shop_code = sl.shop_code
           WHERE ci.name = :name AND ci.is_active = TRUE
           ORDER BY sl.city, sl.shop_name`,
          {
            replacements: { name: item.name },
            type: QueryTypes.SELECT
          }
        ) as Array<{
          id: string;
          shop_code: string;
          quanty: number | null;
          retail_price: number | null;
          modifications: any;
          shop_name: string;
          city: string;
          address: string;
        }>;

        const response: ApiResponse = {
          success: true,
          message: 'Product retrieved successfully',
          data: {
            product: {
              id: item.id,
              name: item.name,
              slug: item.slug,
              category_id: item.category_id,
              characteristics: item.characteristics,
              modifications: item.modifications,
            },
            shops: allShops.map(shop => ({
              shop_code: shop.shop_code,
              shop_name: shop.shop_name,
              city: shop.city,
              address: shop.address,
              quantity: Number(shop.quanty) || 0,
              price: Number(shop.retail_price) || 0,
              modifications: shop.modifications,
              available: shop.quanty && Number(shop.quanty) > 0
            })),
            total_quantity: allShops.reduce((sum, shop) => sum + (Number(shop.quanty) || 0), 0),
            min_price: Math.min(...allShops.map(s => Number(s.retail_price) || 0).filter(p => p > 0)),
            max_price: Math.max(...allShops.map(s => Number(s.retail_price) || 0)),
          },
        };

        res.status(200).json(response);
        return;
      }

      // Fallback to old structure
      const product = await CatalogProduct.findByPk(id, {
        attributes: [
          'id', 'name', 'category_name', 'category_id', 'retail_price', 'quanty',
          'characteristics', 'modifications', 'shop_name', 'shop_code',
          'created_at', 'last_updated'
        ]
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          errors: ['Product not found'],
        });
        return;
      }

      // Get all variants of this product in different shops
      const variants = await CatalogProduct.findAll({
        where: {
          name: product.name,
          is_active: true
        },
        attributes: [
          'id', 'shop_code', 'shop_name', 'quanty', 'retail_price'
        ],
        order: [['shop_name', 'asc']]
      });

      const response: ApiResponse = {
        success: true,
        message: 'Product retrieved successfully',
        data: {
          product,
          variants
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get product by slug
   * Similar to getProductById but uses slug instead of ID
   */
  public async getProductBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slugParam = (req.params.slug || '').trim();

      if (!slugParam) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          errors: ['Product slug is missing'],
        });
        return;
      }

      // Find product by slug in catalog_items
      // First try exact match
      let item = await CatalogItem.findOne({
        where: { slug: slugParam, is_active: true },
        attributes: [
          'id', 'shop_code', 'category_id', 'name', 'slug',
          'quanty', 'retail_price', 'characteristics', 'modifications'
        ]
      });

      // If not found by exact match, try finding by slug prefix (for old URLs without shop_code)
      if (!item) {
        item = await CatalogItem.findOne({
          where: {
            slug: { [Op.like]: `${slugParam}_%` }, // Match slug that starts with given slug + _
            is_active: true
          },
          attributes: [
            'id', 'shop_code', 'category_id', 'name', 'slug',
            'quanty', 'retail_price', 'characteristics', 'modifications'
          ]
        });
      }

      // Try partial match fallback (to handle minor transliteration differences)
      if (!item && slugParam.length > 5) {
        const partialSlug = slugParam.slice(0, Math.max(slugParam.length - 2, 4));
        item = await CatalogItem.findOne({
          where: {
            slug: { [Op.iLike]: `${partialSlug}%` },
            is_active: true,
          },
          attributes: [
            'id', 'shop_code', 'category_id', 'name', 'slug',
            'quanty', 'retail_price', 'characteristics', 'modifications'
          ]
        });
      }

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          errors: ['Product not found with this slug'],
        });
        return;
      }

      // Get all shops where this product is available (by name) with shop details and modifications
      const allShops = await sequelize.query(
        `SELECT 
          ci.id, ci.shop_code, ci.slug, ci.quanty, ci.retail_price,
          ci.modifications,
          sl.shop_name, sl.city, sl.address
         FROM catalog_items ci
         LEFT JOIN shop_locations sl ON ci.shop_code = sl.shop_code
         WHERE ci.name = :name AND ci.is_active = TRUE
         ORDER BY sl.city, sl.shop_name`,
        {
          replacements: { name: item.name },
          type: QueryTypes.SELECT
        }
      ) as Array<{
        id: string;
        shop_code: string;
        slug: string;
        quanty: number | null;
        retail_price: number | null;
        modifications: any;
        shop_name: string;
        city: string;
        address: string;
      }>;

      const response: ApiResponse = {
        success: true,
        message: 'Product retrieved successfully',
        data: {
          product: {
            id: item.id,
            name: item.name,
            slug: item.slug,
            category_id: item.category_id,
            characteristics: item.characteristics,
            modifications: item.modifications,
          },
          shops: allShops.map(shop => ({
            shop_code: shop.shop_code,
            shop_name: shop.shop_name,
            slug: shop.slug,
            city: shop.city,
            address: shop.address,
            quantity: Number(shop.quanty) || 0,
            price: Number(shop.retail_price) || 0,
            modifications: shop.modifications,
            available: shop.quanty && Number(shop.quanty) > 0
          })),
          total_quantity: allShops.reduce((sum, shop) => sum + (Number(shop.quanty) || 0), 0),
          min_price: Math.min(...allShops.map(s => Number(s.retail_price) || 0).filter(p => p > 0)),
          max_price: Math.max(...allShops.map(s => Number(s.retail_price) || 0)),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching product by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        errors: ['Internal server error'],
      });
    }
  }

  public async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          errors: ['Invalid search query'],
        });
        return;
      }

      // Get excluded item IDs
      const excludedIds = await this.getExcludedItemIds();

      // Get search variants with keyboard layout conversion
      const searchVariants = getSearchVariants(query.trim());
      
      const whereCondition: any = {
        is_active: true,
      };

      // Exclude items from exclusions table
      if (excludedIds.length > 0) {
        whereCondition.id = { [Op.notIn]: excludedIds };
      }

      if (searchVariants.length > 1) {
        // Search by all variants (original + alternative layout)
        whereCondition.name = {
          [Op.or]: searchVariants.map(variant => ({
            [Op.iLike]: `%${variant}%`
          }))
        };
      } else {
        // Simple search if no alternative variant
        whereCondition.name = { [Op.iLike]: `%${query}%` };
      }

      const products = await CatalogProduct.findAll({
        where: whereCondition,
        attributes: ['id', 'name', 'category_name', 'retail_price', 'shop_name'],
        limit,
        order: [['name', 'asc']]
      });

      const response: ApiResponse = {
        success: true,
        message: 'Search completed successfully',
        data: { products },
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
   * Get hierarchical categories (only root categories if no parent_id specified)
   */
  public async getHierarchicalCategories(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.query.parent_id as string | undefined;
      const shopCode = req.query.shop_code as string | undefined;

      const where: any = { is_active: true };

      // If parent_id is provided, get subcategories; otherwise get root categories
      if (parentId) {
        where.parent_id = parentId;
      } else {
        where.parent_id = null; // Root categories
      }

      // Optionally filter by shop
      if (shopCode) {
        where.shop_code = shopCode;
      }

      const categories = await CatalogCategory.findAll({
        where,
        attributes: [
          'id',
          'shop_code',
          'name',
          'parent_id',
          'level',
          'full_path',
          'quanty',
          'sort_order',
        ],
        order: [['sort_order', 'asc'], ['name', 'asc']],
      });

      // Group categories by name to avoid duplicates across shops
      const categoryMap = new Map<string, any>();

      for (const category of categories) {
        const key = `${category.name}_${category.level}_${category.parent_id || 'root'}`;
        
        if (!categoryMap.has(key)) {
          // Count total products across all shops for this category
          const productCount = await CatalogItem.count({
            where: {
              category_id: category.id,
              is_active: true,
            },
          });

          // Check if category has subcategories (in any shop)
          const hasSubcategories = await CatalogCategory.count({
            where: {
              parent_id: category.id,
              is_active: true,
            },
          });

          categoryMap.set(key, {
            id: category.id,
            shop_code: category.shop_code,
            name: category.name,
            parent_id: category.parent_id,
            level: category.level,
            full_path: category.full_path,
            product_count: productCount,
            has_subcategories: hasSubcategories > 0,
            sort_order: category.sort_order,
          });
        }
      }

      const categoriesWithCounts = Array.from(categoryMap.values());

      const response: ApiResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories: categoriesWithCounts },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching hierarchical categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get category by ID with its full path
   */
  public async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Find category by ID (any shop_code)
      const category = await CatalogCategory.findOne({
        where: {
          id,
          is_active: true,
        },
        attributes: [
          'id',
          'shop_code',
          'name',
          'parent_id',
          'level',
          'full_path',
          'quanty',
          'sort_order',
        ],
      });

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category not found'],
        });
        return;
      }

      // Get parent categories for breadcrumb
      const breadcrumb: any[] = [];
      if (category.full_path) {
        const pathParts = category.full_path.split(' > ');
        
        for (let i = 0; i < pathParts.length; i++) {
          const currentPath = pathParts.slice(0, i + 1).join(' > ');
          const pathCategory = await CatalogCategory.findOne({
            where: {
              full_path: currentPath,
              is_active: true,
            },
          });
          
          if (pathCategory) {
            breadcrumb.push({
              id: pathCategory.id,
              name: pathCategory.name,
              level: pathCategory.level,
            });
          }
        }
      }

      const response: ApiResponse = {
        success: true,
        message: 'Category retrieved successfully',
        data: {
          category: {
            id: category.id,
            shop_code: category.shop_code,
            name: category.name,
            parent_id: category.parent_id,
            level: category.level,
            full_path: category.full_path,
            sort_order: category.sort_order,
          },
          breadcrumb,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get products by category ID with grouping support
   */
  public async searchProductsGlobally(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const shopCode = req.query.shop_code as string;
      const groupByName = req.query.group_by_name === 'true';
      const searchQuery = req.query.search as string;

      // Get excluded item IDs
      const excludedIds = await this.getExcludedItemIds();

      const where: any = { is_active: true };

      // Exclude items from exclusions table
      if (excludedIds.length > 0) {
        where.id = { [Op.notIn]: excludedIds };
      }

      if (shopCode) {
        where.shop_code = shopCode;
      }

      // Add search filter with keyboard layout variants
      if (searchQuery && searchQuery.trim()) {
        const searchVariants = getSearchVariants(searchQuery.trim());
        
        if (searchVariants.length > 1) {
          // Search by all variants (original + alternative layout)
          where.name = {
            [Op.or]: searchVariants.map(variant => ({
              [Op.iLike]: `%${variant}%`
            }))
          };
        } else {
          // Simple search if no alternative variant
          where.name = { [Op.iLike]: `%${searchQuery.trim()}%` };
        }
      }

      const { count, rows: items } = await CatalogItem.findAndCountAll({
        where,
        order: [['name', 'asc']],
        attributes: [
          'id',
          'shop_code',
          'category_id',
          'name',
          'slug',
          'quanty',
          'retail_price',
          'characteristics',
          'modifications',
        ],
      });

      let products: any[] = items;

      // Group by product name if requested (for general catalog view)
      if (groupByName) {
        const productMap = new Map<string, any>();

        items.forEach(item => {
          const key = item.name;
          if (!productMap.has(key)) {
            productMap.set(key, {
              id: item.id,
              name: item.name,
              slug: item.slug,
              category_id: item.category_id,
              characteristics: item.characteristics,
              modifications: item.modifications,
              shops: []
            });
          }

          // Add shop information
          productMap.get(key).shops.push({
            shop_code: item.shop_code,
            slug: item.slug,
            quanty: Number(item.quanty) || 0,
            price: Number(item.retail_price) || 0
          });
        });

        products = Array.from(productMap.values()).map(product => ({
          ...product,
          total_quantity: product.shops.reduce((sum: number, shop: any) => sum + (shop.quanty || 0), 0),
          min_price: Math.min(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null)),
          max_price: Math.max(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null)),
          available_shops_count: product.shops.filter((shop: any) => shop.quanty && shop.quanty > 0).length
        }));
      }

      // Apply pagination after grouping
      const totalProducts = products.length;
      const paginatedProducts = products.slice(offset, offset + limit);

      const response: ApiResponse = {
        success: true,
        message: searchQuery ? `Found ${totalProducts} products` : 'Products retrieved successfully',
        data: {
          products: paginatedProducts,
          pagination: {
            page,
            limit,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
          },
          mode: groupByName ? 'general' : 'shop',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error searching products globally:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        errors: ['Internal server error'],
      });
    }
  }

  public async getProductsByCategoryId(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const shopCode = req.query.shop_code as string;
      const groupByName = req.query.group_by_name === 'true';
      const searchQuery = req.query.search as string;

      // Get excluded item IDs
      const excludedIds = await this.getExcludedItemIds();

      const where: any = { is_active: true };

      // Exclude items from exclusions table
      if (excludedIds.length > 0) {
        where.id = { [Op.notIn]: excludedIds };
      }

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (shopCode) {
        where.shop_code = shopCode;
      }

      // Add search filter with keyboard layout variants
      if (searchQuery && searchQuery.trim()) {
        const searchVariants = getSearchVariants(searchQuery.trim());
        
        if (searchVariants.length > 1) {
          // Search by all variants (original + alternative layout)
          where.name = {
            [Op.or]: searchVariants.map(variant => ({
              [Op.iLike]: `%${variant}%`
            }))
          };
        } else {
          // Simple search if no alternative variant
          where.name = { [Op.iLike]: `%${searchQuery.trim()}%` };
        }
      }

      const { count, rows: items } = await CatalogItem.findAndCountAll({
        where,
        order: [['name', 'asc']],
        attributes: [
          'id',
          'shop_code',
          'category_id',
          'name',
          'slug',
          'quanty',
          'retail_price',
          'characteristics',
          'modifications',
        ],
      });

      let products: any[] = items;

      // Group by product name if requested (for general catalog view)
      if (groupByName) {
        const productMap = new Map<string, any>();

        items.forEach(item => {
          const key = item.name;
          if (!productMap.has(key)) {
            productMap.set(key, {
              id: item.id,
              name: item.name,
              slug: item.slug,
              category_id: item.category_id,
              characteristics: item.characteristics,
              modifications: item.modifications,
              shops: []
            });
          }

          // Add shop information
          productMap.get(key).shops.push({
            shop_code: item.shop_code,
            slug: item.slug,
            quanty: Number(item.quanty) || 0,
            price: Number(item.retail_price) || 0
          });
        });

        products = Array.from(productMap.values()).map(product => ({
          ...product,
          total_quantity: product.shops.reduce((sum: number, shop: any) => sum + (shop.quanty || 0), 0),
          min_price: Math.min(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null)),
          max_price: Math.max(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null)),
          available_shops_count: product.shops.filter((shop: any) => shop.quanty && shop.quanty > 0).length
        }));
      }

      // Apply pagination after grouping
      const totalProducts = products.length;
      const paginatedProducts = products.slice(offset, offset + limit);

      const response: ApiResponse = {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products: paginatedProducts,
          pagination: {
            page,
            limit,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
          },
          mode: groupByName ? 'general' : 'shop',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching products by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        errors: ['Internal server error'],
      });
    }
  }

  /**
   * Get available shops with full information
   */
  public async getAvailableShops(req: Request, res: Response): Promise<void> {
    try {
      // Get unique shops from catalog_items with shop_locations info
      const shops = await sequelize.query(
        `SELECT 
          ci.shop_code,
          sl.shop_name,
          sl.city,
          sl.address,
          COUNT(DISTINCT ci.id) as product_count
         FROM catalog_items ci
         LEFT JOIN shop_locations sl ON ci.shop_code = sl.shop_code
         WHERE ci.is_active = TRUE 
         GROUP BY ci.shop_code, sl.shop_name, sl.city, sl.address
         ORDER BY sl.city, sl.shop_name`,
        { type: QueryTypes.SELECT }
      ) as Array<{ 
        shop_code: string; 
        shop_name: string;
        city: string;
        address: string;
        product_count: number;
      }>;

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
   * Get popular products based on sales data from last month
   */
  public async getPopularProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      
      logger.info('📊 Fetching popular products from sales data...');

      // Get excluded item IDs
      const excludedIds = await this.getExcludedItemIds();

      // SQL query to get top selling products from last month
      // Request more items to account for exclusions (limit * 10 to ensure enough products after filtering)
      const queryLimit = limit * 10;
      const query = `
        SELECT 
          pi.name,
          pi.category,
          SUM(pi.quantity) as total_sold,
          COUNT(DISTINCT pi.check_id) as purchase_count,
          ROUND(AVG(pi.price)::numeric, 2) as avg_price,
          MAX(pi.price) as max_price,
          MIN(pi.price) as min_price
        FROM purchase_items pi
        INNER JOIN purchases p ON pi.check_id = p.check_id
        WHERE 
          p.time_end >= NOW() - INTERVAL '30 days'
          AND pi.name IS NOT NULL
          AND pi.quantity > 0
        GROUP BY pi.name, pi.category
        ORDER BY total_sold DESC, purchase_count DESC
        LIMIT $1
      `;

      const popularProducts = await sequelize.query(query, {
        bind: [queryLimit],
        type: QueryTypes.SELECT
      }) as any[];

      logger.info(`✅ Found ${popularProducts.length} popular products`);

      // Get catalog items for these products to get additional info
      const enrichedProducts = await Promise.all(
        popularProducts.map(async (product) => {
          // Try to find matching catalog item
          const catalogItem = await CatalogItem.findOne({
            where: {
              name: {
                [Op.iLike]: `%${product.name}%`
              },
              // Exclude items from exclusions table
              ...(excludedIds.length > 0 && { id: { [Op.notIn]: excludedIds } })
            },
            order: [['quanty', 'DESC']] // Prioritize items with stock
          });

          return {
            id: catalogItem?.id || product.name,
            name: product.name,
            category: product.category,
            total_sold: Number(product.total_sold),
            purchase_count: Number(product.purchase_count),
            price: Number(product.avg_price),
            min_price: Number(product.min_price),
            max_price: Number(product.max_price),
            // Additional catalog info if available
            shop_code: catalogItem?.shop_code,
            in_stock: catalogItem ? Number(catalogItem.quanty) > 0 : false,
            stock_quantity: catalogItem ? Number(catalogItem.quanty) : 0,
            // Mark if catalog item found (to filter out excluded items)
            _hasCatalogItem: !!catalogItem
          };
        })
      );

      // Filter out excluded products and limit results
      const filteredProducts = enrichedProducts
        .filter(p => p._hasCatalogItem)
        .slice(0, limit)
        .map(({ _hasCatalogItem, ...product }) => product); // Remove internal flag

      logger.info(`✅ Returning ${filteredProducts.length} popular products after exclusions`);

      const response: ApiResponse = {
        success: true,
        message: 'Popular products fetched successfully',
        data: {
          products: filteredProducts,
          period: 'last_30_days',
          timestamp: new Date()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching popular products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular products',
        errors: ['Internal server error']
      });
    }
  }

  private groupProductsByName(products: CatalogProduct[]): any[] {
    const productMap = new Map<string, any>();

    products.forEach(product => {
      const key = product.name;
      if (!productMap.has(key)) {
        productMap.set(key, {
          id: product.id,
          name: product.name,
          category_name: product.category_name,
          retail_price: product.retail_price,
          characteristics: product.characteristics,
          modifications: product.modifications,
          created_at: product.created_at,
          last_updated: product.last_updated,
          shops: []
        });
      }

      // Add shop information
      productMap.get(key).shops.push({
        shop_code: product.shop_code,
        shop_name: product.shop_name,
        quanty: Number(product.quanty) || 0,
        price: Number(product.retail_price) || 0
      });
    });

    return Array.from(productMap.values()).map(product => ({
      ...product,
      total_quantity: product.shops.reduce((sum: number, shop: any) => sum + (shop.quanty || 0), 0),
      min_price: Math.min(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null)),
      max_price: Math.max(...product.shops.map((shop: any) => shop.price).filter((p: number) => p !== null))
    }));
  }
}

export default new CatalogController();
