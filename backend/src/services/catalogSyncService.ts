import axios from 'axios';
import fs from 'fs';
import path from 'path';
import forge from 'node-forge';
import https from 'https';
import { fileURLToPath } from 'url';
import { config } from '@/config';
import logger from '@/utils/logger';
import sequelize from '@/config/database';
import CatalogProduct from '@/models/CatalogProduct';
import CatalogCategory from '@/models/CatalogCategory';
import CatalogItem from '@/models/CatalogItem';
import ShopLocation from '@/models/ShopLocation';
import { QueryTypes } from 'sequelize';

// Types
interface BalanceAPIResponse {
  success: boolean;
  status?: string;
  data?: any;
  message?: string;
}

interface CatalogData {
  shopname: string;
  shop_id?: string;
  shop_address?: string;
  shop_city?: string;
  categories: Category[];
}

interface Category {
  id: string | null;
  name: string;
  quanty?: number | null;
  products?: Product[];
  subcategories?: Category[];
}

interface Product {
  id: string | null;
  name: string;
  quanty?: number | null;
  retail_price?: number | null;
  purchase_price?: number | null;
  modifications?: Modification[];
}

interface Modification {
  id: string;
  name: string;
  quanty?: number | null;
  retail_price?: number | null;
}

interface ProductToSave {
  id: string;
  name: string;
  category_name: string;
  category_id: string | null;
  retail_price: number | null;
  quanty: number | null;
  characteristics: any;
  modifications: any[];
  shop_code: string;
  shop_name: string;
  last_updated: Date;
}

interface SyncResult {
  success: boolean;
  shop_code: string;
  shop_name: string;
  products_added: number;
  products_updated: number;
  products_deactivated: number;
  total_products: number;
  error?: string | undefined;
  duration_ms: number;
}

// Configuration
const BALANCE_API_CONFIG = {
  username: process.env.BALANCE_API_USERNAME || 'ТерехинНА',
  password: process.env.BALANCE_API_PASSWORD || '123455123',
  apiUrl: process.env.BALANCE_API_URL || 'https://cloud.mda-medusa.ru/mda-trade/hs/Api/BalanceData',
};

const CERT_PATH = process.env.BALANCE_API_CERT_PATH 
  ? path.resolve(process.cwd(), process.env.BALANCE_API_CERT_PATH)
  : path.join(process.cwd(), 'routes', 'certs', 'terehin_n.cloud.mda-medusa.ru.p12');
const CERT_PASSWORD = process.env.BALANCE_API_CERT_PASSWORD || '000000000';

// Exclusions cache
interface ExclusionsCache {
  products: Set<string>;
  categories: Set<string>;
  lastUpdated: number;
  cacheDuration: number;
}

let exclusionsCache: ExclusionsCache = {
  products: new Set(),
  categories: new Set(),
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

class CatalogSyncService {
  private httpsAgent: https.Agent | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize HTTPS agent in constructor to avoid blocking imports
  }

  /**
   * Ensure HTTPS agent is initialized (lazy initialization)
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      try {
        this.initializeHttpsAgent();
        this.initialized = true;
      } catch (error) {
        logger.error('❌ Failed to initialize HTTPS agent:', error);
        logger.warn('⚠️ Service will continue without HTTPS agent');
        this.initialized = true; // Mark as initialized even on error to avoid retry loops
      }
    }
  }

  /**
   * Initialize HTTPS agent with client certificate
   */
  private initializeHttpsAgent(): void {
    try {
      logger.info(`🔍 Checking certificate at: ${CERT_PATH}`);
      
      if (!fs.existsSync(CERT_PATH)) {
        logger.warn(`⚠️ Certificate not found: ${CERT_PATH}`);
        logger.warn('⚠️ Will attempt to sync without certificate');
        return;
      }

      logger.info('📄 Reading certificate file...');
      const certBuffer = fs.readFileSync(CERT_PATH);
      
      logger.info('🔐 Parsing certificate...');
      const p12Der = forge.util.createBuffer(certBuffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, CERT_PASSWORD);

      // Extract certificate and private key
      let privateKey: string | undefined;
      let certificate: string | undefined;
      
      const certBagType = forge.pki.oids.certBag as string;
      const keyBagType = forge.pki.oids.pkcs8ShroudedKeyBag as string;

      const certBags = p12.getBags({ bagType: certBagType }) as any;
      const keyBags = p12.getBags({ bagType: keyBagType }) as any;

      if (certBags[certBagType] && certBags[certBagType].length) {
        certificate = forge.pki.certificateToPem(certBags[certBagType][0].cert);
      }

      if (keyBags[keyBagType] && keyBags[keyBagType].length) {
        privateKey = forge.pki.privateKeyToPem(keyBags[keyBagType][0].key);
      }

      if (!certificate || !privateKey) {
        logger.warn('⚠️ Could not extract certificate or private key');
        return;
      }

      // Setup HTTPS agent with client certificate
      this.httpsAgent = new https.Agent({
        rejectUnauthorized: true,
        cert: certificate,
        key: privateKey,
      });

      logger.info('✅ HTTPS agent initialized with client certificate');
    } catch (error) {
      logger.error('❌ Error initializing HTTPS agent:', error);
    }
  }

  /**
   * Send request to Balance API
   */
  private async sendBalanceRequest(shopId: string, type: string = 'store_data'): Promise<BalanceAPIResponse> {
    try {
      this.ensureInitialized();
      logger.info(`🌐 Sending request to Balance API: shopId: ${shopId}, type: ${type}`);

      const requestData = {
        shop_id: shopId,
        type: type,
      };

      const credentials = Buffer.from(`${BALANCE_API_CONFIG.username}:${BALANCE_API_CONFIG.password}`).toString('base64');

      const options: any = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        timeout: 30000, // 30 seconds timeout
      };

      // Add HTTPS agent if available
      if (this.httpsAgent) {
        options.httpsAgent = this.httpsAgent;
      }

      logger.debug(`📤 Request payload: ${JSON.stringify(requestData)}`);
      const response = await axios.post<any>(BALANCE_API_CONFIG.apiUrl, requestData, options);

      // Handle response
      if (response.data) {
        const responseData = response.data as any;
        if (responseData.status === 'success') {
          logger.info(`✅ Successful response from Balance API (${type})`);
          return {
            success: true,
            data: responseData.data,
          };
        } else if (responseData.status === 'error') {
          logger.warn(`⚠️ Error from Balance API (${type}): ${responseData.message}`);
          return {
            success: false,
            message: responseData.message || 'Error from API',
          };
        } else {
          // If server returned data without status field - consider it successful
          logger.info(`✅ Received data from Balance API (${type}) without status field`);
          return {
            success: true,
            data: responseData,
          };
        }
      } else {
        logger.warn(`⚠️ Empty response from Balance API: ${response.status}`);
        return {
          success: false,
          message: 'Empty response from API',
        };
      }
    } catch (error: any) {
      logger.error(`❌ Error sending request to Balance API (${type}):`, error.message);

      if (error.response) {
        logger.error('📥 Server response:', error.response.status, error.response.data);
        return {
          success: false,
          message: `Error from API: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        };
      }

      return {
        success: false,
        message: `Error sending request: ${error.message}`,
      };
    }
  }

  /**
   * Build readable catalog from Balance API response
   */
  private buildReadableCatalog(payload: BalanceAPIResponse): CatalogData | null {
    logger.debug('🔍 Analyzing data structure from Balance API');

    if (!payload || !payload.data) {
      logger.warn('⚠️ Empty data from Balance API');
      return null;
    }

    const data = payload.data;

    // Check if data is already in the correct format
    if (data.categories && Array.isArray(data.categories)) {
      logger.info('✅ Data already in correct format, returning as is');
      return {
        shopname: data.shopname || '',
        categories: data.categories,
      };
    }

    // If data is in raw format, transform it
    if (data.items && Array.isArray(data.items)) {
      logger.info('🔄 Transforming raw data into readable format');

      const mapProduct = (node: any): Product => {
        let retailPrice: number | null = null;
        let purchasePrice: number | null = null;
        let modifications: Modification[] = [];

        // If product has modifications (items), process them
        if (Array.isArray(node.items) && node.items.length > 0) {
          const allItemsHavePrice = node.items.every((item: any) => item.retail_price !== undefined);

          if (allItemsHavePrice) {
            // This is a product with modifications
            retailPrice = node.items[0].retail_price;
            purchasePrice = node.items[0].purchase_price;

            modifications = node.items.map((item: any) => ({
              id: item.id || null,
              name: item.name || '',
              quanty: item.quanty ?? null,
              retail_price: item.retail_price,
            }));
          } else {
            // This is a regular product
            const priceLeaf = node.items[0];
            retailPrice = priceLeaf.retail_price;
            purchasePrice = priceLeaf.purchase_price;
          }
        } else if (node.retail_price !== undefined) {
          // Simple product without modifications
          retailPrice = node.retail_price;
          purchasePrice = node.purchase_price;
        }

        const product: Product = {
          id: node.id || null,
          name: node.name || '',
          quanty: node.quanty ?? null,
          retail_price: retailPrice,
          purchase_price: purchasePrice,
        };

        // Add modifications only if they exist
        if (modifications.length > 0) {
          product.modifications = modifications;
        }

        return product;
      };

      const mapCategory = (cat: any): Category => {
        if (!Array.isArray(cat.items)) {
          return {
            id: cat.id || null,
            name: cat.name || '',
            quanty: cat.quanty ?? null,
            products: [],
          };
        }

        const children = cat.items;

        // Check if there are nested categories
        const hasNestedCategories = children.some((ch: any) => {
          if (!ch.items || !Array.isArray(ch.items) || ch.items.length === 0) {
            return false;
          }
          const allItemsHavePrice = ch.items.every((item: any) => item.retail_price !== undefined);
          return !allItemsHavePrice;
        });

        if (hasNestedCategories) {
          return {
            id: cat.id || null,
            name: cat.name || '',
            quanty: cat.quanty ?? null,
            subcategories: children.map(mapCategory),
          };
        }

        // Regular case: category -> product list
        const products = children.map(mapProduct);

        return {
          id: cat.id || null,
          name: cat.name || '',
          quanty: cat.quanty ?? null,
          products,
        };
      };

      const categories = data.items.map(mapCategory);

      const result: CatalogData = {
        shopname: data.shopname || '',
        categories,
      };

      logger.info('✅ Successfully transformed raw data');
      return result;
    }

    logger.error('❌ Unknown data structure:', typeof data);
    return null;
  }

  /**
   * Load exclusions from database
   */
  private async loadExclusions(): Promise<ExclusionsCache> {
    try {
      const now = Date.now();

      // If cache is fresh, use it
      if (now - exclusionsCache.lastUpdated < exclusionsCache.cacheDuration) {
        return exclusionsCache;
      }

      logger.info('🔄 Loading catalog exclusions from DB...');

      const result = await sequelize.query(
        `SELECT exclusion_type, item_id FROM catalog_exclusions WHERE is_active = TRUE`,
        { type: QueryTypes.SELECT }
      ) as Array<{ exclusion_type: string; item_id: string }>;

      // Update cache
      exclusionsCache.products.clear();
      exclusionsCache.categories.clear();

      result.forEach((row) => {
        if (row.exclusion_type === 'product') {
          exclusionsCache.products.add(row.item_id);
        } else if (row.exclusion_type === 'category') {
          exclusionsCache.categories.add(row.item_id);
        }
      });

      exclusionsCache.lastUpdated = now;

      logger.info(`✅ Loaded exclusions: ${exclusionsCache.products.size} products, ${exclusionsCache.categories.size} categories`);

      return exclusionsCache;
    } catch (error) {
      logger.error('❌ Error loading exclusions:', error);
      // Return empty cache in case of error
      return {
        products: new Set(),
        categories: new Set(),
        lastUpdated: Date.now(),
        cacheDuration: exclusionsCache.cacheDuration,
      };
    }
  }

  /**
   * Clean product names (remove "(акциз)", etc.)
   */
  private cleanProductName(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') return name || '';

    let cleanedName = name;

    // Remove "(акциз)" and similar variants
    cleanedName = cleanedName.replace(/\s*\(акциз\)/gi, '');

    // Replace long names with short ones
    cleanedName = cleanedName.replace(/Сертификат на Безникотиновую Жидкость для ЭСДН/gi, 'Жидкость для ЭСДН');
    cleanedName = cleanedName.replace(/Сертификат на Жидкость для ЭС/gi, 'Жидкость для ЭСДН');

    // Remove extra spaces
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

    return cleanedName;
  }

  /**
   * Strip purchase prices and apply exclusions
   */
  private async stripPurchasePrices(catalog: CatalogData): Promise<CatalogData> {
    if (!catalog || !Array.isArray(catalog.categories)) return catalog;

    // Load exclusions
    const exclusions = await this.loadExclusions();

    const sanitizeCategory = (cat: Category): Category | null => {
      if (!cat) return cat;

      // Check if this category is excluded
      if (cat.id && exclusions.categories.has(cat.id)) {
        logger.debug(`🚫 Excluded category: ${cat.name} (ID: ${cat.id})`);
        return null;
      }

      const copy = { ...cat };

      // Filter products
      if (Array.isArray(copy.products)) {
        copy.products = copy.products
          .filter((p) => {
            if (!p || !p.id) return true;

            // Check exclusions
            if (exclusions.products.has(p.id)) {
              logger.debug(`🚫 Excluded product: ${p.name} (ID: ${p.id})`);
              return false;
            }
            return true;
          })
          .map((p) => {
            if (!p) return p;
            const { purchase_price, ...rest } = p as any;
            
            // Clean product name
            if (rest.name) {
              rest.name = this.cleanProductName(rest.name);
            }

            // Process product modifications
            if (Array.isArray(rest.modifications)) {
              rest.modifications = rest.modifications.map((mod: any) => {
                if (!mod) return mod;
                const { purchase_price: modPurchasePrice, ...modRest } = mod;
                
                // Clean modification name
                if (modRest.name) {
                  modRest.name = this.cleanProductName(modRest.name);
                }
                return modRest;
              });
            }

            return rest;
          });
      }

      // Recursively process subcategories
      if (Array.isArray(copy.subcategories)) {
        copy.subcategories = copy.subcategories
          .map(sanitizeCategory)
          .filter((subcat): subcat is Category => subcat !== null);
      }

      return copy;
    };

    return {
      ...catalog,
      categories: catalog.categories
        .map(sanitizeCategory)
        .filter((cat): cat is Category => cat !== null),
    };
  }

  /**
   * Save products to database
   */
  private async saveProductsToDatabase(
    catalog: CatalogData,
    shopCode: string,
    shopName: string
  ): Promise<{ added: number; updated: number; deactivated: number }> {
    try {
      logger.info(`💾 Saving products to DB for shop ${shopName} (${shopCode})`);

      if (!catalog || !catalog.categories || !Array.isArray(catalog.categories)) {
        logger.info('⚠️ No data to save');
        return { added: 0, updated: 0, deactivated: 0 };
      }

      const productsToSave: ProductToSave[] = [];
      const now = new Date();

      // Recursive function to extract all products from catalog
      const extractProducts = (categories: Category[], parentCategoryName: string = '') => {
        for (const category of categories) {
          if (category.products && Array.isArray(category.products)) {
            for (const product of category.products) {
              if (product.id) {
                // Collect product characteristics
                const characteristics: any = {};
                let modifications: any = null;

                // If product has modifications, save them
                if (product.modifications && Array.isArray(product.modifications)) {
                  const validModifications = product.modifications.filter(
                    (mod) => mod && mod.name && mod.name.trim() !== '' && mod.id
                  );

                  if (validModifications.length > 0) {
                    modifications = validModifications.map((mod) => ({
                      id: mod.id,
                      name: mod.name.trim(),
                      quanty: mod.quanty,
                      retail_price: mod.retail_price
                        ? parseFloat(String(mod.retail_price).replace(/\s+/g, '').replace(',', '.'))
                        : null,
                    }));
                  }

                  // Also collect characteristics for backward compatibility
                  const flavors: string[] = [];
                  const colors: string[] = [];
                  const otherVariants: string[] = [];

                  validModifications.forEach((mod) => {
                    if (mod.name && mod.name !== product.name) {
                      const modName = mod.name.toLowerCase();

                      if (modName.includes('вкус') || modName.includes('ароматизатор') || modName.includes('аромат')) {
                        const flavor = mod.name.replace(/^(вкус|ароматизатор|аромат)[:\s]*/i, '').trim();
                        if (flavor && !flavors.includes(flavor)) {
                          flavors.push(flavor);
                        }
                      } else if (modName.includes('цвет') || modName.includes('окраска')) {
                        const color = mod.name.replace(/^(цвет|окраска)[:\s]*/i, '').trim();
                        if (color && !colors.includes(color)) {
                          colors.push(color);
                        }
                      } else {
                        const cleanVariant = mod.name.trim();
                        if (cleanVariant && !otherVariants.includes(cleanVariant)) {
                          otherVariants.push(cleanVariant);
                        }
                      }
                    }
                  });

                  if (flavors.length > 0) characteristics['вкус'] = flavors;
                  if (colors.length > 0) characteristics['цвет'] = colors;
                  if (otherVariants.length > 0 && flavors.length === 0 && colors.length === 0) {
                    characteristics['вариант'] = otherVariants;
                  }
                }

                // Convert string values to numbers
                const retailPrice = product.retail_price
                  ? parseFloat(String(product.retail_price).replace(/\s+/g, '').replace(',', '.'))
                  : null;
                const quantity = product.quanty
                  ? parseFloat(String(product.quanty).replace(/\s+/g, '').replace(',', '.'))
                  : null;

                productsToSave.push({
                  id: product.id,
                  name: this.cleanProductName(product.name),
                  category_name: category.name,
                  category_id: category.id,
                  retail_price: retailPrice,
                  quanty: quantity,
                  characteristics: Object.keys(characteristics).length > 0 ? characteristics : null,
                  modifications: modifications,
                  shop_code: shopCode,
                  shop_name: shopName,
                  last_updated: now,
                });
              }
            }
          }

          // Recursively process subcategories
          if (category.subcategories && Array.isArray(category.subcategories)) {
            extractProducts(category.subcategories, category.name);
          }
        }
      };

      extractProducts(catalog.categories);

      logger.info(`📦 Found ${productsToSave.length} products to save`);

      if (productsToSave.length === 0) {
        return { added: 0, updated: 0, deactivated: 0 };
      }

      // Use transaction for bulk update
      const transaction = await sequelize.transaction();

      try {
        // First, mark all products of this shop as inactive
        await sequelize.query(
          `UPDATE catalog_products SET is_active = FALSE, last_updated = :now WHERE shop_code = :shopCode`,
          {
            replacements: { now, shopCode },
            type: QueryTypes.UPDATE,
            transaction,
          }
        );

        const deactivatedCount = await sequelize.query(
          `SELECT COUNT(*) as count FROM catalog_products WHERE shop_code = :shopCode AND is_active = FALSE`,
          {
            replacements: { shopCode },
            type: QueryTypes.SELECT,
            transaction,
          }
        );

        let addedCount = 0;
        let updatedCount = 0;

        // Then insert/update products
        for (const product of productsToSave) {
          const [result] = await sequelize.query(
            `
            INSERT INTO catalog_products (
              id, name, category_name, category_id, retail_price, quanty,
              characteristics, modifications, shop_code, shop_name, is_active, last_updated, created_at
            ) VALUES (
              :id, :name, :category_name, :category_id, :retail_price, :quanty,
              :characteristics::jsonb, :modifications::jsonb, :shop_code, :shop_name, TRUE, :last_updated, :created_at
            )
            ON CONFLICT (id, shop_code) DO UPDATE SET
              name = EXCLUDED.name,
              category_name = EXCLUDED.category_name,
              category_id = EXCLUDED.category_id,
              retail_price = EXCLUDED.retail_price,
              quanty = EXCLUDED.quanty,
              characteristics = EXCLUDED.characteristics,
              modifications = EXCLUDED.modifications,
              shop_name = EXCLUDED.shop_name,
              is_active = TRUE,
              last_updated = EXCLUDED.last_updated
            RETURNING (xmax = 0) AS inserted
            `,
            {
              replacements: {
                id: product.id,
                name: product.name,
                category_name: product.category_name,
                category_id: product.category_id,
                retail_price: product.retail_price,
                quanty: product.quanty,
                characteristics: product.characteristics ? JSON.stringify(product.characteristics) : null,
                modifications: product.modifications ? JSON.stringify(product.modifications) : null,
                shop_code: product.shop_code,
                shop_name: product.shop_name,
                last_updated: product.last_updated,
                created_at: now,
              },
              type: QueryTypes.INSERT,
              transaction,
            }
          );

          if ((result as any)[0]?.inserted) {
            addedCount++;
          } else {
            updatedCount++;
          }
        }

        await transaction.commit();

        logger.info(`✅ Saved ${productsToSave.length} products for shop ${shopName}`);
        logger.info(`   📈 Added: ${addedCount}, Updated: ${updatedCount}, Deactivated: ${(deactivatedCount as any)[0]?.count || 0}`);

        return {
          added: addedCount,
          updated: updatedCount,
          deactivated: (deactivatedCount as any)[0]?.count || 0,
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('❌ Error saving products to DB:', error);
      throw error;
    }
  }

  /**
   * Save categories and items to new database structure
   */
  private async saveCategoriesAndItemsToDatabase(
    catalogData: CatalogData,
    shopCode: string,
    shopName: string
  ): Promise<{ categories: number; items: number }> {
    const transaction = await sequelize.transaction();
    
    try {
      const now = new Date();
      let categoriesCount = 0;
      let itemsCount = 0;
      
      // Recursive function to process categories
      const processCategory = async (
        category: Category,
        parentId: string | null = null,
        level: number = 0,
        pathArray: string[] = []
      ): Promise<void> => {
        if (!category.name) return;
        
        const categoryId = category.id || `cat_${category.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const fullPath = [...pathArray, category.name].join(' > ');
        
        // Save category
        await sequelize.query(
          `INSERT INTO catalog_categories 
          (id, shop_code, name, parent_id, parent_shop_code, level, full_path, quanty, is_active, sort_order, created_at, updated_at)
          VALUES (:id, :shop_code, :name, :parent_id, :parent_shop_code, :level, :full_path, :quanty, TRUE, :sort_order, :created_at, :updated_at)
          ON CONFLICT (id, shop_code) DO UPDATE SET
            name = EXCLUDED.name,
            parent_id = EXCLUDED.parent_id,
            parent_shop_code = EXCLUDED.parent_shop_code,
            level = EXCLUDED.level,
            full_path = EXCLUDED.full_path,
            quanty = EXCLUDED.quanty,
            is_active = TRUE,
            sort_order = EXCLUDED.sort_order,
            updated_at = EXCLUDED.updated_at`,
          {
            replacements: {
              id: categoryId,
              shop_code: shopCode,
              name: category.name,
              parent_id: parentId,
              parent_shop_code: parentId ? shopCode : null,
              level,
              full_path: fullPath,
              quanty: category.quanty || null,
              sort_order: 0,
              created_at: now,
              updated_at: now,
            },
            type: QueryTypes.INSERT,
            transaction,
          }
        );
        categoriesCount++;
        
        // Process products if any
        if (category.products && Array.isArray(category.products)) {
          for (const product of category.products) {
            if (!product.id || !product.name) continue;
            
            const cleanName = this.cleanProductName(product.name);
            
            // Convert comma to dot for numeric values (and remove spaces)
            const quanty = product.quanty 
              ? parseFloat(String(product.quanty).replace(/\s+/g, '').replace(',', '.'))
              : null;
            const retailPrice = product.retail_price
              ? parseFloat(String(product.retail_price).replace(/\s+/g, '').replace(',', '.'))
              : null;
            
            // Process modifications to convert commas to dots (and remove spaces)
            let modificationsJson = null;
            if (product.modifications && Array.isArray(product.modifications)) {
              const cleanedMods = product.modifications.map(mod => ({
                ...mod,
                quanty: mod.quanty ? parseFloat(String(mod.quanty).replace(/\s+/g, '').replace(',', '.')) : null,
                retail_price: mod.retail_price ? parseFloat(String(mod.retail_price).replace(/\s+/g, '').replace(',', '.')) : null,
              }));
              modificationsJson = JSON.stringify(cleanedMods);
            }
            
            await sequelize.query(
              `INSERT INTO catalog_items
              (id, shop_code, category_id, name, quanty, retail_price, characteristics, modifications, is_active, last_updated, created_at)
              VALUES (:id, :shop_code, :category_id, :name, :quanty, :retail_price, :characteristics::jsonb, :modifications::jsonb, TRUE, :last_updated, :created_at)
              ON CONFLICT (id, shop_code) DO UPDATE SET
                category_id = EXCLUDED.category_id,
                name = EXCLUDED.name,
                quanty = EXCLUDED.quanty,
                retail_price = EXCLUDED.retail_price,
                characteristics = EXCLUDED.characteristics,
                modifications = EXCLUDED.modifications,
                is_active = TRUE,
                last_updated = EXCLUDED.last_updated`,
              {
                replacements: {
                  id: product.id,
                  shop_code: shopCode,
                  category_id: categoryId,
                  name: cleanName,
                  quanty,
                  retail_price: retailPrice,
                  characteristics: JSON.stringify({ full_path: fullPath }),
                  modifications: modificationsJson,
                  last_updated: now,
                  created_at: now,
                },
                type: QueryTypes.INSERT,
                transaction,
              }
            );
            itemsCount++;
          }
        }
        
        // Process subcategories recursively
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            await processCategory(subcategory, categoryId, level + 1, [...pathArray, category.name]);
          }
        }
      };
      
      // Process all top-level categories
      for (const category of catalogData.categories) {
        await processCategory(category);
      }
      
      // Deactivate categories and items that weren't updated
      await sequelize.query(
        `UPDATE catalog_categories SET is_active = FALSE 
         WHERE shop_code = :shop_code AND updated_at < :now`,
        {
          replacements: { shop_code: shopCode, now },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );
      
      await sequelize.query(
        `UPDATE catalog_items SET is_active = FALSE 
         WHERE shop_code = :shop_code AND last_updated < :now`,
        {
          replacements: { shop_code: shopCode, now },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );
      
      await transaction.commit();
      
      logger.info(`✅ Saved ${categoriesCount} categories and ${itemsCount} items for shop ${shopName}`);
      
      return { categories: categoriesCount, items: itemsCount };
    } catch (error) {
      await transaction.rollback();
      logger.error('❌ Error saving categories and items:', error);
      throw error;
    }
  }

  /**
   * Sync catalog for a specific shop
   */
  public async syncShopCatalog(shopCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`🔄 Starting catalog sync for shop ${shopCode}`);

      // Log sync start
      await sequelize.query(
        `INSERT INTO catalog_sync_log (shop_code, sync_type, status, started_at) 
         VALUES (:shopCode, 'manual', 'started', :startedAt)`,
        {
          replacements: { shopCode, startedAt: new Date() },
          type: QueryTypes.INSERT,
        }
      );

      // Get shop information
      const shopResult = await ShopLocation.findOne({
        where: { shop_code: shopCode, is_active: true },
      });

      if (!shopResult) {
        logger.warn(`⚠️ Shop ${shopCode} not found or inactive`);
        const duration = Date.now() - startTime;
        
        return {
          success: false,
          shop_code: shopCode,
          shop_name: 'Unknown',
          products_added: 0,
          products_updated: 0,
          products_deactivated: 0,
          total_products: 0,
          error: 'Shop not found or inactive',
          duration_ms: duration,
        };
      }

      const shop = shopResult.toJSON();

      // Request catalog from Balance API
      const balanceResult = await this.sendBalanceRequest(shopCode, 'store_data');

      if (!balanceResult.success) {
        logger.warn(`⚠️ Error getting data from Balance API for shop ${shopCode}: ${balanceResult.message}`);
        const duration = Date.now() - startTime;
        
        // Log sync failure
        await sequelize.query(
          `UPDATE catalog_sync_log 
           SET status = 'failed', error_message = :error, duration_ms = :duration, completed_at = :completedAt
           WHERE id = (
             SELECT id FROM catalog_sync_log 
             WHERE shop_code = :shopCode AND status = 'started'
             ORDER BY started_at DESC LIMIT 1
           )`,
          {
            replacements: {
              shopCode,
              error: balanceResult.message,
              duration,
              completedAt: new Date(),
            },
            type: QueryTypes.UPDATE,
          }
        );
        
        return {
          success: false,
          shop_code: shopCode,
          shop_name: shop.shop_name,
          products_added: 0,
          products_updated: 0,
          products_deactivated: 0,
          total_products: 0,
          error: balanceResult.message || 'Unknown error',
          duration_ms: duration,
        };
      }

      // Transform data to readable format
      let catalogData = this.buildReadableCatalog(balanceResult);

      if (!catalogData) {
        logger.warn(`⚠️ Could not transform data from Balance API for shop ${shopCode}`);
        const duration = Date.now() - startTime;
        
        return {
          success: false,
          shop_code: shopCode,
          shop_name: shop.shop_name,
          products_added: 0,
          products_updated: 0,
          products_deactivated: 0,
          total_products: 0,
          error: 'Could not transform API data',
          duration_ms: duration,
        };
      }

      // Update shop information
      catalogData.shop_id = shop.shop_code;
      catalogData.shopname = shop.shop_name;

      // Process catalog (remove purchase prices, exclusions, etc.)
      catalogData = await this.stripPurchasePrices(catalogData);

      // Save products to OLD database structure (for backward compatibility)
      const saveResult = await this.saveProductsToDatabase(catalogData, shopCode, shop.shop_name);

      // Save categories and items to NEW database structure
      const newSaveResult = await this.saveCategoriesAndItemsToDatabase(catalogData, shopCode, shop.shop_name);
      
      logger.info(`📊 New structure: ${newSaveResult.categories} categories, ${newSaveResult.items} items`);

      const duration = Date.now() - startTime;

      // Log sync success
      await sequelize.query(
        `UPDATE catalog_sync_log 
         SET status = 'success', 
             products_synced = :total,
             products_added = :added,
             products_updated = :updated,
             products_deactivated = :deactivated,
             duration_ms = :duration,
             completed_at = :completedAt
         WHERE id = (
           SELECT id FROM catalog_sync_log 
           WHERE shop_code = :shopCode AND status = 'started'
           ORDER BY started_at DESC LIMIT 1
         )`,
        {
          replacements: {
            shopCode,
            total: saveResult.added + saveResult.updated,
            added: saveResult.added,
            updated: saveResult.updated,
            deactivated: saveResult.deactivated,
            duration,
            completedAt: new Date(),
          },
          type: QueryTypes.UPDATE,
        }
      );

      logger.info(`✅ Catalog sync completed for shop ${shop.shop_name} in ${duration}ms`);

      return {
        success: true,
        shop_code: shopCode,
        shop_name: shop.shop_name,
        products_added: saveResult.added,
        products_updated: saveResult.updated,
        products_deactivated: saveResult.deactivated,
        total_products: saveResult.added + saveResult.updated,
        duration_ms: duration,
      };
    } catch (error: any) {
      logger.error(`❌ Error syncing catalog for shop ${shopCode}:`, error);
      const duration = Date.now() - startTime;

      // Log sync error
      await sequelize.query(
        `UPDATE catalog_sync_log 
         SET status = 'failed', error_message = :error, duration_ms = :duration, completed_at = :completedAt
         WHERE id = (
           SELECT id FROM catalog_sync_log 
           WHERE shop_code = :shopCode AND status = 'started'
           ORDER BY started_at DESC LIMIT 1
         )`,
        {
          replacements: {
            shopCode,
            error: error.message,
            duration,
            completedAt: new Date(),
          },
          type: QueryTypes.UPDATE,
        }
      );

      return {
        success: false,
        shop_code: shopCode,
        shop_name: 'Unknown',
        products_added: 0,
        products_updated: 0,
        products_deactivated: 0,
        total_products: 0,
        error: error.message,
        duration_ms: duration,
      };
    }
  }

  /**
   * Sync catalogs for all active shops
   */
  public async syncAllShops(): Promise<SyncResult[]> {
    try {
      logger.info('🔄 Starting catalog sync for all active shops');

      // Get all active shops
      const shops = await ShopLocation.findAll({
        where: { is_active: true },
        attributes: ['shop_code', 'shop_name'],
      });

      if (shops.length === 0) {
        logger.warn('⚠️ No active shops found');
        return [];
      }

      logger.info(`📍 Found ${shops.length} active shops to sync`);

      // Sync each shop
      const results: SyncResult[] = [];
      for (const shop of shops) {
        const result = await this.syncShopCatalog(shop.shop_code);
        results.push(result);
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      logger.info(`✅ Catalog sync completed: ${successful} successful, ${failed} failed`);

      return results;
    } catch (error) {
      logger.error('❌ Error syncing all shop catalogs:', error);
      throw error;
    }
  }
}

export default new CatalogSyncService();

