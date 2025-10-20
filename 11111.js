import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../utils/database.js';
import fetch from 'node-fetch';
import cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import forge from 'node-forge';

// Middleware для аутентификации: JWT токен ИЛИ статический токен
const authenticateTokenOrStatic = async (req, res, next) => {
  try {
    // Проверяем наличие статического токена в заголовке Authorization
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Static ')) {
      const token = authHeader.substring(7); // Убираем 'Static '

      if (token === process.env.STATIC_TOKEN) {
        // Создаем фиктивного пользователя для статического токена
        req.user = {
          id: 'static_user',
          telegram_id: null,
          role: 'static_access'
        };
        console.log('🔑 Аутентификация по статическому токену успешна');
        return next();
      }
    }

    // Если статический токен не подошел, пробуем стандартную JWT аутентификацию
    return authenticateToken(req, res, next);
  } catch (error) {
    console.error('❌ Ошибка аутентификации:', error);
    return res.status(401).json({ success: false, message: 'Ошибка аутентификации' });
  }
};

const router = express.Router();

// Конфигурация Balance API
const BALANCE_API_CONFIG = {
  username: 'ТерехинНА',
  password: '123455123',
  apiUrl: 'https://cloud.mda-medusa.ru/mda-trade/hs/Api/BalanceData',
  credentials: Buffer.from('ТерехинНА:123455123').toString('base64')
};

// Путь к сертификату
const CERT_PATH = path.join(process.cwd(), 'routes', 'certs', 'terehin_n.cloud.mda-medusa.ru.p12');
const CERT_PASSWORD = '000000000';

// Функция инициализации HTTPS агента с сертификатом
function initializeHttpsAgent() {
  try {
    if (!fs.existsSync(CERT_PATH)) {
      console.warn(`⚠️ Сертификат не найден: ${CERT_PATH}`);
      return null;
    }

    const certBuffer = fs.readFileSync(CERT_PATH);
    const p12Der = forge.util.createBuffer(certBuffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, CERT_PASSWORD);

    // Извлекаем сертификат и приватный ключ
    let privateKey, certificate;
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    if (certBags[forge.pki.oids.certBag] && certBags[forge.pki.oids.certBag].length) {
      certificate = forge.pki.certificateToPem(certBags[forge.pki.oids.certBag][0].cert);
    }

    if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length) {
      privateKey = forge.pki.privateKeyToPem(keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key);
    }

    // Настраиваем https агент с клиентским сертификатом
    return new https.Agent({
      rejectUnauthorized: true,
      cert: certificate,
      key: privateKey
    });
  } catch (error) {
    console.error('❌ Ошибка при инициализации HTTPS агента:', error);
    return null;
  }
}

// Функция для отправки запроса к Balance API
async function sendBalanceRequest(shopId, type = 'store_data') {
  try {
    console.log(`🌐 Отправка запроса к Balance API: shopId: ${shopId}, type: ${type}`);

    const httpsAgent = initializeHttpsAgent();
    if (!httpsAgent) {
      throw new Error('Не удалось инициализировать HTTPS агент с сертификатом');
    }

    // Подготавливаем данные для отправки
    const requestData = {
      shop_id: shopId,
      type: type
    };

    // Подготавливаем опции запроса с сертификатом
    const options = {
      httpsAgent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${BALANCE_API_CONFIG.credentials}`
      },
      timeout: 30000 // 30 секунд таймаут
    };

    // Отправляем запрос к API
    console.log(`📤 Отправка запроса: ${JSON.stringify(requestData)}`);
    const response = await axios.post(BALANCE_API_CONFIG.apiUrl, requestData, options);

    // Обрабатываем ответ
    if (response.data) {
      if (response.data.status === 'success') {
        console.log(`✅ Успешный ответ от Balance API (${type})`);
        return {
          success: true,
          data: response.data.data
        };
      } else if (response.data.status === 'error') {
        console.warn(`⚠️ Ошибка от Balance API (${type}): ${response.data.message}`);
        return {
          success: false,
          message: response.data.message || 'Ошибка от API'
        };
      } else {
        // Если сервер вернул данные без поля status - считаем это успешным ответом
        console.log(`✅ Получены данные от Balance API (${type}) без поля status`);
        return {
          success: true,
          data: response.data
        };
      }
    } else {
      console.warn(`⚠️ Пустой ответ от Balance API: ${response.status}`);
      return {
        success: false,
        message: 'Получен пустой ответ от API'
      };
    }
  } catch (error) {
    console.error(`❌ Ошибка при отправке запроса к Balance API (${type}):`, error.message);

    if (error.response) {
      console.error('📥 Ответ сервера:', error.response.status, error.response.data);
      return {
        success: false,
        message: `Ошибка от API: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      };
    }

    return {
      success: false,
      message: `Ошибка при отправке запроса: ${error.message}`
    };
  }
}

// Функция для построения удобочитаемого каталога из данных Balance API
function buildReadableCatalog(payload) {
  console.log('🔍 Анализируем структуру данных от Balance API');
  
  if (!payload || !payload.data) {
    console.warn('⚠️ Пустые данные от Balance API');
    return { success: false, reason: 'empty' };
  }

  const data = payload.data;
  
  // Проверяем, если данные уже в нужном формате (как в balance_catalog_readable.json)
  if (data.categories && Array.isArray(data.categories)) {
    console.log('✅ Данные уже в нужном формате, возвращаем как есть');
    return {
      shopname: data.shopname || '',
      categories: data.categories
    };
  }
  
  // Если данные в сыром формате, преобразуем их
  if (data.items && Array.isArray(data.items)) {
    console.log('🔄 Преобразуем сырые данные в удобочитаемый формат');
    
    const mapProduct = (node) => {
      // Проверяем разные возможные структуры данных
      let retailPrice = null;
      let purchasePrice = null;
      let modifications = [];
      
      // Если у товара есть модификации (items), обрабатываем их
      if (Array.isArray(node.items) && node.items.length > 0) {
        // Проверяем, все ли элементы в items имеют retail_price (это значит, что node - товар с модификациями)
        const allItemsHavePrice = node.items.every(item => item.retail_price !== undefined);
        
        if (allItemsHavePrice) {
          // Это товар с модификациями
          // Берем общую цену из первого элемента (обычно все модификации одной цены)
          retailPrice = node.items[0].retail_price;
          purchasePrice = node.items[0].purchase_price;
          
          modifications = node.items.map(item => ({
            id: item.id || null,
            name: item.name || '',
            quanty: item.quanty ?? null,
            retail_price: item.retail_price
          }));
        } else {
          // Это обычный товар, берем цену из первого элемента
          const priceLeaf = node.items[0];
          retailPrice = priceLeaf.retail_price;
          purchasePrice = priceLeaf.purchase_price;
        }
      } else if (node.retail_price !== undefined) {
        // Простой товар без модификаций
        retailPrice = node.retail_price;
        purchasePrice = node.purchase_price;
      }
      
      const product = {
        id: node.id || null,
        name: node.name || '',
        quanty: node.quanty ?? null,
        retail_price: retailPrice,
        purchase_price: purchasePrice
      };
      
      // Добавляем модификации только если они есть
      if (modifications.length > 0) {
        product.modifications = modifications;
      }
      
      return product;
    };

    const mapCategory = (cat) => {
      if (!Array.isArray(cat.items)) {
        return {
          id: cat.id || null,
          name: cat.name || '',
          quanty: cat.quanty ?? null,
          products: []
        };
      }
      
      const children = cat.items;
      
      // Проверяем, есть ли вложенные категории
      // Категория определяется как элемент, который:
      // 1. Имеет поле items
      // 2. НЕ все элементы в items имеют retail_price (если все имеют retail_price, то это товар с модификациями)
      const hasNestedCategories = children.some(ch => {
        if (!ch.items || !Array.isArray(ch.items) || ch.items.length === 0) {
          return false;
        }
        // Если все элементы в items имеют retail_price, то это товар с модификациями, а не категория
        const allItemsHavePrice = ch.items.every(item => item.retail_price !== undefined);
        return !allItemsHavePrice; // Возвращаем true, если это категория (не все items имеют цену)
      });

      if (hasNestedCategories) {
        return {
          id: cat.id || null,
          name: cat.name || '',
          quanty: cat.quanty ?? null,
          subcategories: children.map(sc => mapCategory(sc))
        };
      }

      // Обычный случай: категория -> список товаров (включая товары с модификациями)
      const products = children.map(mapProduct);
      
      return {
        id: cat.id || null,
        name: cat.name || '',
        quanty: cat.quanty ?? null,
        products
      };
    };

    const categories = data.items.map(mapCategory);
    
    const result = {
      shopname: data.shopname || '',
      categories
    };
    
    console.log('✅ Успешно преобразованы сырые данные');
    return result;
  }

  console.error('❌ Неизвестная структура данных:', typeof data);
  return { success: false, reason: 'unknown_structure' };
}

// Кэш исключений для избежания частых запросов к БД
let exclusionsCache = {
  products: new Set(),
  categories: new Set(),
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000 // 5 минут
};

// Кэш каталогов для каждого магазина
let catalogsCache = new Map();
let catalogsLastUpdated = 0;
const CATALOGS_CACHE_DURATION = 60 * 60 * 1000; // 60 минут (1 час) - увеличено для снижения нагрузки на API

// Загрузка исключений из базы данных
async function loadExclusions() {
  try {
    const now = Date.now();
    
    // Если кэш свежий, используем его
    if (now - exclusionsCache.lastUpdated < exclusionsCache.cacheDuration) {
      return exclusionsCache;
    }
    
    console.log('🔄 Загружаем исключения каталога из БД...');
    
    // Загружаем исключения из БД
    const result = await query(`
      SELECT exclusion_type, item_id 
      FROM catalog_exclusions 
      WHERE is_active = TRUE
    `);
    
    // Обновляем кэш
    exclusionsCache.products.clear();
    exclusionsCache.categories.clear();
    
    result.rows.forEach(row => {
      if (row.exclusion_type === 'product') {
        exclusionsCache.products.add(row.item_id);
      } else if (row.exclusion_type === 'category') {
        exclusionsCache.categories.add(row.item_id);
      }
    });
    
    exclusionsCache.lastUpdated = now;
    
    console.log(`✅ Загружено исключений: ${exclusionsCache.products.size} товаров, ${exclusionsCache.categories.size} категорий`);
    
    return exclusionsCache;
  } catch (error) {
    console.error('❌ Ошибка загрузки исключений:', error);
    // Возвращаем пустой кэш в случае ошибки
    return {
      products: new Set(),
      categories: new Set(),
      lastUpdated: Date.now(),
      cacheDuration: exclusionsCache.cacheDuration
    };
  }
}

// Очистка названий товаров
function cleanProductName(name) {
  if (!name || typeof name !== 'string') return name;
  
  let cleanedName = name;
  
  // Убираем "(акциз)" и аналогичные варианты
  cleanedName = cleanedName.replace(/\s*\(акциз\)/gi, '');
  
  // Заменяем длинные названия на короткие
  cleanedName = cleanedName.replace(/Сертификат на Безникотиновую Жидкость для ЭСДН/gi, 'Жидкость для ЭСДН');
  cleanedName = cleanedName.replace(/Сертификат на Жидкость для ЭС/gi, 'Жидкость для ЭСДН');
  
  // Убираем лишние пробелы
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  
  return cleanedName;
}

// Функция для обновления каталога конкретного магазина
async function updateShopCatalog(shopCode, shopName) {
  try {
    console.log(`🔄 Обновление каталога для магазина ${shopName} (код: ${shopCode})`);
    
    // Получаем информацию о магазине
    const shopResult = await query(`
      SELECT shop_code, shop_name, is_active
      FROM shop_locations 
      WHERE shop_code = $1 AND is_active = TRUE
    `, [shopCode]);
    
    if (shopResult.rows.length === 0) {
      console.log(`⚠️ Магазин ${shopCode} не найден или неактивен, пропускаем`);
      return false;
    }
    
    const shop = shopResult.rows[0];
    let catalogData = null;
    
    // Пытаемся получить каталог из Balance API

    const balanceResult = await sendBalanceRequest(shopCode, 'store_data');
    
    if (balanceResult.success) {

      
      // Преобразуем данные в удобочитаемый формат
      catalogData = buildReadableCatalog(balanceResult);
      
      if (catalogData.success === false) {
        console.warn(`⚠️ Не удалось преобразовать данные от Balance API для магазина ${shopCode}: ${catalogData.reason}`);
        catalogData = null;
      }
    } else {
      console.warn(`⚠️ Ошибка получения данных от Balance API для магазина ${shopCode}: ${balanceResult.message}`);
    }
    
    // Если не удалось получить из API, возвращаем пустой каталог
    if (!catalogData) {
   
      catalogData = {
        shopname: shop.shop_name,
        categories: []
      };
    }
    
    // Обновляем информацию о магазине
    catalogData.shop_id = shop.shop_code;
    catalogData.shopname = shop.shop_name;
    
    // Обрабатываем каталог (убираем закупочные цены, исключения и т.д.)
    const processedCatalog = await stripPurchasePrices(catalogData);

    // Сохраняем товары в базу данных (если получили данные из API)
    if (balanceResult.success && catalogData && catalogData.categories && catalogData.categories.length > 0) {
      try {
        await saveProductsToDatabase(catalogData, shopCode, shop.shop_name);
      } catch (saveError) {
        console.error(`⚠️ Ошибка сохранения товаров для магазина ${shopCode}:`, saveError);
        // Не прерываем выполнение, если не удалось сохранить товары
      }
    }

    // Сохраняем в кэш
    catalogsCache.set(shopCode, {
      data: processedCatalog,
      timestamp: Date.now(),
      source: balanceResult.success ? 'api' : 'empty'
    });


    return true;
    
  } catch (error) {
    console.error(`❌ Ошибка обновления каталога для магазина ${shopCode}:`, error);
    return false;
  }
}

// Функция для обновления всех каталогов
async function updateAllCatalogs() {
  try {

    
    // Получаем все активные магазины
    const shopsResult = await query(`
      SELECT shop_code, shop_name 
      FROM shop_locations 
      WHERE is_active = TRUE
    `);
    
    if (shopsResult.rows.length === 0) {

      return;
    }
    
    
    
    // Обновляем каталоги для каждого магазина
    const updatePromises = shopsResult.rows.map(shop => 
      updateShopCatalog(shop.shop_code, shop.shop_name)
    );
    
    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    catalogsLastUpdated = Date.now();
    
    console.log(`✅ Обновление каталогов завершено: ${successful} успешно, ${failed} неудачно`);
    
  } catch (error) {
    console.error('❌ Ошибка обновления каталогов:', error);
  }
}

// Запускаем обновление каталогов каждые 30 минут
cron.schedule('*/30 * * * *', async () => {
  console.log('⏰ Запуск планового обновления каталогов...');
  await updateAllCatalogs();
});

// Запускаем первое обновление при старте сервера через 10 секунд
setTimeout(async () => {
  await updateAllCatalogs();
}, 10000); // Через 10 секунд после запуска

// Функция для сохранения товаров в базу данных
async function saveProductsToDatabase(catalog, shopCode, shopName) {
  try {
    console.log(`💾 Сохранение товаров в БД для магазина ${shopName} (${shopCode})`);

    if (!catalog || !catalog.categories || !Array.isArray(catalog.categories)) {
      console.log('⚠️ Нет данных для сохранения');
      return;
    }

    const productsToSave = [];
    const now = new Date();

    // Рекурсивная функция для извлечения всех товаров из каталога
    const extractProducts = (categories) => {
      for (const category of categories) {
        if (category.products && Array.isArray(category.products)) {
          for (const product of category.products) {
            if (product.id) {
              // Собираем характеристики товара
              const characteristics = {};
              let modifications = null;

              // Если у товара есть модификации, сохраняем их как есть и собираем характеристики
              if (product.modifications && Array.isArray(product.modifications)) {
                // Фильтруем модификации с пустыми именами и сохраняем только валидные
                const validModifications = product.modifications.filter(mod =>
                  mod && mod.name && mod.name.trim() !== '' && mod.id
                );

                if (validModifications.length > 0) {
                  modifications = validModifications.map(mod => ({
                    id: mod.id,
                    name: mod.name.trim().replace(/"/g, '\\"'), // Экранируем только кавычки для JSON
                    quanty: mod.quanty,
                    retail_price: mod.retail_price ? parseFloat(String(mod.retail_price).replace(',', '.')) : null
                  }));
                }

                // Также собираем характеристики для обратной совместимости
                const flavors = [];
                const colors = [];
                const otherVariants = [];

                validModifications.forEach(mod => {
                  if (mod.name && mod.name !== product.name) {
                    const modName = mod.name.toLowerCase();

                    // Определяем тип характеристики
                    if (modName.includes('вкус') || modName.includes('ароматизатор') || modName.includes('аромат')) {
                      const flavor = mod.name.replace(/^(вкус|ароматизатор|аромат)[:\s]*/i, '').trim().replace(/"/g, '\\"');
                      if (flavor && !flavors.includes(flavor)) {
                        flavors.push(flavor);
                      }
                    } else if (modName.includes('цвет') || modName.includes('окраска')) {
                      const color = mod.name.replace(/^(цвет|окраска)[:\s]*/i, '').trim().replace(/"/g, '\\"');
                      if (color && !colors.includes(color)) {
                        colors.push(color);
                      }
                    } else {
                      // Для других характеристик сохраняем как варианты
                      const cleanVariant = mod.name.trim().replace(/"/g, '\\"');
                      if (cleanVariant && !otherVariants.includes(cleanVariant)) {
                        otherVariants.push(cleanVariant);
                      }
                    }
                  }
                });

                // Сохраняем характеристики
                if (flavors.length > 0) {
                  characteristics['вкус'] = flavors;
                }
                if (colors.length > 0) {
                  characteristics['цвет'] = colors;
                }
                if (otherVariants.length > 0 && flavors.length === 0 && colors.length === 0) {
                  characteristics['вариант'] = otherVariants;
                }
              }

              // Преобразуем строковые значения в числа, заменяя запятую на точку
              const retailPrice = product.retail_price ?
                parseFloat(String(product.retail_price).replace(',', '.')) : null;
              const quantity = product.quanty ?
                parseFloat(String(product.quanty).replace(',', '.')) : null;

              productsToSave.push({
                id: product.id,
                name: product.name,
                category_name: category.name,
                category_id: category.id,
                retail_price: retailPrice,
                quanty: quantity,
                characteristics: Object.keys(characteristics).length > 0 ? characteristics : null,
                modifications: modifications,
                shop_code: shopCode,
                shop_name: shopName,
                last_updated: now
              });
            }
          }
        }

        // Рекурсивно обрабатываем подкатегории
        if (category.subcategories && Array.isArray(category.subcategories)) {
          extractProducts(category.subcategories);
        }
      }
    };

    extractProducts(catalog.categories);

    console.log(`📦 Найдено ${productsToSave.length} товаров для сохранения`);

    if (productsToSave.length === 0) {
      return;
    }

    // Используем транзакцию для массового обновления
    await query('BEGIN');

    try {
      // Сначала помечаем все товары этого магазина как неактивные
      await query(`
        UPDATE catalog_products
        SET is_active = FALSE, last_updated = $1
        WHERE shop_code = $2
      `, [now, shopCode]);

      // Затем вставляем/обновляем товары
      for (const product of productsToSave) {
        // Проверяем корректность JSON данных перед сохранением
        let characteristicsJson = null;
        let modificationsJson = null;

        try {
          if (product.characteristics) {
            characteristicsJson = JSON.stringify(product.characteristics);
            // Проверяем, что JSON валиден
            JSON.parse(characteristicsJson);
          }
          if (product.modifications) {
            modificationsJson = JSON.stringify(product.modifications);
            // Проверяем, что JSON валиден
            JSON.parse(modificationsJson);
          }
        } catch (jsonError) {
          console.warn(`⚠️ Пропускаем товар ${product.id} из-за некорректного JSON:`, jsonError.message);
          continue; // Пропускаем товар с некорректным JSON
        }

        await query(`
          INSERT INTO catalog_products (
            id, name, category_name, category_id, retail_price, quanty,
            characteristics, modifications, shop_code, shop_name, is_active, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11)
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
        `, [
          product.id,
          product.name,
          product.category_name,
          product.category_id,
          product.retail_price,
          product.quanty,
          characteristicsJson,
          modificationsJson,
          product.shop_code,
          product.shop_name,
          product.last_updated
        ]);
      }

      await query('COMMIT');
      console.log(`✅ Сохранено ${productsToSave.length} товаров для магазина ${shopName}`);

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Ошибка сохранения товаров в БД:', error);
    throw error;
  }
}

// Удаление закупочной цены из дерева каталога, очистка названий и фильтрация исключений
async function stripPurchasePrices(catalog) {
  if (!catalog || !Array.isArray(catalog.categories)) return catalog;
  
  // Загружаем исключения
  const exclusions = await loadExclusions();
  
  const sanitizeCategory = (cat) => {
    if (!cat) return cat;
    
    // Проверяем, не исключена ли эта категория
    if (cat.id && exclusions.categories.has(cat.id)) {
      console.log(`🚫 Исключена категория: ${cat.name} (ID: ${cat.id})`);
      return null; // Исключаем категорию
    }
    
    const copy = { ...cat };
    
    // Фильтруем товары
    if (Array.isArray(copy.products)) {
      copy.products = copy.products
        .filter(p => {
          if (!p || !p.id) return true; // Оставляем товары без ID
          
          // Проверяем исключения
          if (exclusions.products.has(p.id)) {
        
            return false;
          }
          return true;
        })
        .map(p => {
          if (!p) return p;
          const { purchase_price, ...rest } = p;
          // Очищаем название товара
          if (rest.name) {
            rest.name = cleanProductName(rest.name);
          }
          
          // Обрабатываем модификации товара (убираем purchase_price из них)
          if (Array.isArray(rest.modifications)) {
            rest.modifications = rest.modifications.map(mod => {
              if (!mod) return mod;
              const { purchase_price: modPurchasePrice, ...modRest } = mod;
              // Очищаем название модификации
              if (modRest.name) {
                modRest.name = cleanProductName(modRest.name);
              }
              return modRest;
            });
          }
          
          return rest;
        });
    }
    
    // Рекурсивно обрабатываем подкатегории
    if (Array.isArray(copy.subcategories)) {
      copy.subcategories = copy.subcategories
        .map(sanitizeCategory)
        .filter(subcat => subcat !== null); // Убираем исключенные подкатегории
    }
    
    return copy;
  };
  
  return {
    ...catalog,
    categories: catalog.categories
      .map(sanitizeCategory)
      .filter(cat => cat !== null) // Убираем исключенные категории
  };
}

// Получение истории магазинов пользователя
router.get('/user-shops-history', authenticateTokenOrStatic, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Получаем номер телефона пользователя
    const userResult = await query(
      'SELECT normalized_phone FROM users WHERE id = $1',
      [userId]
    );
    
    const users = userResult.rows || userResult;
    
    if (!users.length) {
      return res.json({ success: true, data: [] });
    }
    
    const userPhone = users[0].normalized_phone;
    
    console.log(`📞 Номер телефона пользователя: "${userPhone}"`);
    
    if (!userPhone) {
      console.log('⚠️ У пользователя нет номера телефона');
      return res.json({ success: true, data: [] });
    }
    
    // Получаем уникальные магазины из истории покупок
    // Ищем по номеру с плюсом и без плюса (для совместимости)
    const historyQuery = `
      SELECT DISTINCT 
        p.shopname,
        sl.shop_name,
        sl.address,
        sl.city,
        sl.phone,
        sl.working_hours,
        sl.twogis_url,
        sl.yandex_maps_url,
        sl.google_maps_url,
        sl.shop_code as id,
        COUNT(p.id) as visit_count,
        MAX(p.created_at) as last_visit
      FROM purchases p
      LEFT JOIN shop_locations sl ON p.shopname = sl.shop_name
      WHERE p.user_phone = $1 OR p.user_phone = $2
      GROUP BY p.shopname, sl.shop_name, sl.address, sl.city, sl.phone, sl.working_hours, sl.twogis_url, sl.yandex_maps_url, sl.google_maps_url, sl.shop_code
      ORDER BY visit_count DESC, last_visit DESC
      LIMIT 10
    `;
    
    // Создаем варианты номера телефона (с плюсом и без)
    const phoneWithPlus = userPhone.startsWith('+') ? userPhone : `+${userPhone}`;
    const phoneWithoutPlus = userPhone.startsWith('+') ? userPhone.slice(1) : userPhone;
    
    const historyResult = await query(historyQuery, [phoneWithoutPlus, phoneWithPlus]);
    const historyShops = historyResult.rows || historyResult;
    
    console.log(`🛍️ Найдено магазинов в истории: ${historyShops.length}`);
    if (historyShops.length > 0) {
      console.log('📊 Первая запись:', historyShops[0]);
    }
    
    // Форматируем данные
    const formattedShops = historyShops.map(shop => ({
      id: shop.id || `history_${shop.shopname}`,
      name: shop.shop_name || shop.shopname,
      address: shop.address || '',
      city: shop.city || '',
      phone: shop.phone || '',
      workingHours: shop.working_hours || '',
      twogis_url: shop.twogis_url || '',
      yandex_maps_url: shop.yandex_maps_url || '', 
      google_maps_url: shop.google_maps_url || '',
      visitCount: shop.visit_count,
      lastVisit: shop.last_visit
    }));
    
    res.json({ 
      success: true, 
      data: formattedShops 
    });
    
  } catch (error) {
    console.error('Ошибка получения истории магазинов:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера при получении истории магазинов' 
    });
  }
});

// Список магазинов из базы данных
router.get('/shops', authenticateTokenOrStatic, async (req, res) => {
  try {
    // Получаем магазины из БД (используем shop_locations)
    const result = await query(`
      SELECT 
        shop_code as id,
        shop_name,
        address,
        city,
        description,
        phone,
        working_hours,
        twogis_url,
        yandex_maps_url,
        google_maps_url,
        priority_order
      FROM shop_locations 
      WHERE is_active = TRUE 
      ORDER BY city ASC, priority_order ASC, shop_name ASC
    `);
    
    const shops = result.rows.map(shop => ({
      id: shop.id,
      name: shop.address || shop.shop_name,
      shortName: shop.shop_name,
      address: shop.address,
      city: shop.city,
      description: shop.description,
      phone: shop.phone,
      workingHours: shop.working_hours,
      twogis_url: shop.twogis_url,
      yandex_maps_url: shop.yandex_maps_url,
      google_maps_url: shop.google_maps_url
    }));
    
    console.log(`📍 Загружено ${shops.length} активных магазинов из shop_locations`);
    return res.json({ success: true, data: shops });
  } catch (e) {
    console.error('Ошибка в /api/catalog/shops:', e);
    
    // Fallback к старому поведению в случае ошибки БД
    const fallbackShops = [
      { id: '13', name: 'Калинина 10', shortName: 'Калинина 10' }
    ];
    
    console.log('⚠️ Используем fallback список магазинов');
    return res.json({ success: true, data: fallbackShops });
  }
});

// Каталог по магазину
router.get('/shop/:id', authenticateTokenOrStatic, async (req, res) => {
  try {
    const shopId = req.params.id;
    
    // Проверяем существование магазина в БД (используем shop_locations)
    const shopResult = await query(`
      SELECT shop_code, shop_name, address, city, description, is_active
      FROM shop_locations 
      WHERE shop_code = $1 AND is_active = TRUE
    `, [shopId]);
    
    if (shopResult.rows.length === 0) {
      console.log(`🚫 Магазин с кодом ${shopId} не найден в shop_locations или неактивен`);
      return res.status(404).json({ success: false, message: 'Магазин не найден' });
    }
    
    const shop = shopResult.rows[0];
    console.log(`📍 Загружаем каталог для магазина: ${shop.shop_name} (код: ${shopId})`);

    // Проверяем кэш каталога
    const now = Date.now();
    const cachedCatalog = catalogsCache.get(shopId);
    
    if (cachedCatalog && (now - cachedCatalog.timestamp) < CATALOGS_CACHE_DURATION) {
      console.log(`⚡ Используем кэшированный каталог для магазина ${shop.shop_name}`);
      
      // Обновляем информацию о магазине из БД (может измениться)
      const catalogData = {
        ...cachedCatalog.data,
        shop_id: shop.shop_code,
        shopname: shop.address || shop.shop_name,
        shop_address: shop.address,
        shop_city: shop.city
      };
      
      return res.json({ success: true, data: catalogData });
    }

    // Если кэш устарел или отсутствует, загружаем заново
    console.log(`🔄 Кэш устарел или отсутствует, загружаем каталог для магазина ${shop.shop_name}`);
    
    // Пытаемся получить каталог из Balance API
    console.log(`🌐 Запрашиваем каталог из Balance API для магазина ${shopId}`);
    const balanceResult = await sendBalanceRequest(shopId, 'store_data');
    
    let json = null;
    let source = 'file';
    
    if (balanceResult.success) {
      console.log(`✅ Получены данные от Balance API для магазина ${shopId}`);
      
      // Преобразуем данные в удобочитаемый формат
      json = buildReadableCatalog(balanceResult);
      
      if (json.success === false) {
        console.warn(`⚠️ Не удалось преобразовать данные от Balance API для магазина ${shopId}: ${json.reason}`);
        json = null;
      } else {
        source = 'api';
      }
    } else {
      console.warn(`⚠️ Ошибка получения данных от Balance API для магазина ${shopId}: ${balanceResult.message}`);
    }
    
    // Если не удалось получить из API, создаем пустой каталог
    if (!json) {
      console.log(`⚠️ Магазин ${shopId} не найден в Balance API, создаем пустой каталог`);
      json = {
        shopname: shop.shop_name,
        categories: []
      };
    }
    
    // Обновляем информацию о магазине из БД
    json.shop_id = shop.shop_code;
    json.shopname = shop.address || shop.shop_name;
    json.shop_address = shop.address;
    json.shop_city = shop.city;
    
    const sanitized = await stripPurchasePrices(json);
    
    // Сохраняем в кэш
    catalogsCache.set(shopId, {
      data: sanitized,
      timestamp: now,
      source: source === 'api' ? 'api' : 'empty'
    });
    
    console.log(`✅ Каталог для магазина ${shop.shop_name} успешно загружен и обработан (источник: ${source === 'api' ? 'Balance API' : 'пустой каталог'})`);
    return res.json({ success: true, data: sanitized });
  } catch (e) {
    console.error('Ошибка в /api/catalog/shop/:id:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Возвращает тестовый каталог для магазина 13
router.get('/test', authenticateTokenOrStatic, async (req, res) => {
  try {
    // Читаем подготовленный JSON из test/balance_catalog_readable.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataPath = path.join(__dirname, '..', '..', 'test', 'balance_catalog_readable.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ success: false, message: 'Файл каталога не найден' });
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const json = JSON.parse(raw);
    const sanitized = await stripPurchasePrices(json);
    return res.json({ success: true, data: sanitized });
  } catch (e) {
    console.error('Ошибка в /api/catalog/test:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Управление исключениями (для администраторов)
router.post('/exclusions', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { exclusion_type, item_id, reason } = req.body;
    
    if (!exclusion_type || !item_id) {
      return res.status(400).json({ success: false, message: 'Необходимы exclusion_type и item_id' });
    }

    if (!['product', 'category'].includes(exclusion_type)) {
      return res.status(400).json({ success: false, message: 'exclusion_type должен быть product или category' });
    }

    const result = await query(`
      INSERT INTO catalog_exclusions (exclusion_type, item_id, reason, created_by) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (exclusion_type, item_id) 
      DO UPDATE SET 
        reason = EXCLUDED.reason,
        is_active = TRUE,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [exclusion_type, item_id, reason || null, req.user.telegram_id]);

    // Очищаем кэш
    exclusionsCache.lastUpdated = 0;

    return res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Ошибка в /api/catalog/exclusions (POST):', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка исключений
router.get('/exclusions', authenticateTokenOrStatic, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM catalog_exclusions 
      WHERE is_active = TRUE 
      ORDER BY exclusion_type, created_at DESC
    `);

    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Ошибка в /api/catalog/exclusions (GET):', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Удаление исключения
router.delete('/exclusions/:type/:id', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { type, id } = req.params;

    const result = await query(`
      UPDATE catalog_exclusions 
      SET is_active = FALSE 
      WHERE exclusion_type = $1 AND item_id = $2
      RETURNING *
    `, [type, id]);

    // Очищаем кэш
    exclusionsCache.lastUpdated = 0;

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Исключение не найдено' });
    }

    return res.json({ success: true, message: 'Исключение удалено', data: result.rows[0] });
  } catch (e) {
    console.error('Ошибка в /api/catalog/exclusions (DELETE):', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// === УПРАВЛЕНИЕ МАГАЗИНАМИ (shop_locations) ===

// Создание нового магазина
router.post('/shops', authenticateTokenOrStatic, async (req, res) => {
  try {
    const {
      shop_code,
      shop_name,
      address,
      city,
      description,
      phone,
      working_hours,
      twogis_url,
      yandex_maps_url,
      google_maps_url,
      priority_order
    } = req.body;
    
    if (!shop_code || !shop_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Необходимы shop_code и shop_name' 
      });
    }

    const result = await query(`
      INSERT INTO shop_locations (
        shop_code, shop_name, address, city, description, phone, working_hours,
        twogis_url, yandex_maps_url, google_maps_url, priority_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      shop_code, 
      shop_name, 
      address || null, 
      city || 'Москва', 
      description || null, 
      phone || null,
      working_hours || null,
      twogis_url || null,
      yandex_maps_url || null,
      google_maps_url || null,
      priority_order || 0
    ]);

    console.log(`✅ Создан магазин: ${shop_name} (код: ${shop_code})`);
    return res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    if (e.code === '23505') { // Unique violation
      return res.status(409).json({ 
        success: false, 
        message: 'Магазин с таким shop_code уже существует' 
      });
    }
    
    console.error('Ошибка в POST /api/catalog/shops:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Обновление магазина
router.put('/shops/:shop_code', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { shop_code } = req.params;
    const { 
      shop_name, 
      address, 
      city, 
      description, 
      phone, 
      working_hours,
      twogis_url,
      yandex_maps_url,
      google_maps_url,
      priority_order, 
      is_active 
    } = req.body;

    const result = await query(`
      UPDATE shop_locations 
      SET 
        shop_name = COALESCE($2, shop_name),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        description = COALESCE($5, description),
        phone = COALESCE($6, phone),
        working_hours = COALESCE($7, working_hours),
        twogis_url = COALESCE($8, twogis_url),
        yandex_maps_url = COALESCE($9, yandex_maps_url),
        google_maps_url = COALESCE($10, google_maps_url),
        priority_order = COALESCE($11, priority_order),
        is_active = COALESCE($12, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE shop_code = $1
      RETURNING *
    `, [
      shop_code,
      shop_name,
      address,
      city,
      description,
      phone,
      working_hours,
      twogis_url,
      yandex_maps_url,
      google_maps_url,
      priority_order,
      is_active
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Магазин не найден' });
    }

    console.log(`✅ Обновлен магазин: ${result.rows[0].shop_name} (код: ${shop_code})`);
    return res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Ошибка в PUT /api/catalog/shops/:shop_code:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение информации о конкретном магазине
router.get('/shops/:shop_code', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { shop_code } = req.params;

    const result = await query(`
      SELECT * FROM shop_locations WHERE shop_code = $1
    `, [shop_code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Магазин не найден' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Ошибка в GET /api/catalog/shops/:shop_code:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение всех магазинов (включая неактивные) для администрирования
router.get('/shops/admin/all', authenticateTokenOrStatic, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM shop_locations 
      ORDER BY priority_order ASC, shop_name ASC
    `);

    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Ошибка в GET /api/catalog/shops/admin/all:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Деактивация магазина (мягкое удаление)
router.delete('/shops/:shop_code', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { shop_code } = req.params;

    const result = await query(`
      UPDATE shop_locations 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE shop_code = $1
      RETURNING *
    `, [shop_code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Магазин не найден' });
    }

    console.log(`🗑️ Деактивирован магазин: ${result.rows[0].shop_name} (код: ${shop_code})`);
    return res.json({ 
      success: true, 
      message: 'Магазин деактивирован', 
      data: result.rows[0] 
    });
  } catch (e) {
    console.error('Ошибка в DELETE /api/catalog/shops/:shop_code:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// API для ручного обновления каталогов
router.post('/update-catalogs', authenticateTokenOrStatic, async (req, res) => {
  try {
    console.log('🔄 Ручное обновление каталогов запрошено пользователем');
    
    // Запускаем обновление в фоне
    updateAllCatalogs().then(() => {
      console.log('✅ Ручное обновление каталогов завершено');
    }).catch(error => {
      console.error('❌ Ошибка ручного обновления каталогов:', error);
    });

    return res.json({ 
      success: true, 
      message: 'Обновление каталогов запущено',
      note: 'Обновление выполняется в фоновом режиме'
    });
  } catch (e) {
    console.error('Ошибка в POST /api/catalog/update-catalogs:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// API для получения статуса кэша каталогов
router.get('/catalogs-status', authenticateTokenOrStatic, async (req, res) => {
  try {
    const now = Date.now();
    const cacheStatus = {
      lastUpdated: catalogsLastUpdated,
      lastUpdatedFormatted: new Date(catalogsLastUpdated).toLocaleString('ru-RU'),
      cacheDuration: CATALOGS_CACHE_DURATION,
      cachedShops: Array.from(catalogsCache.keys()),
      cacheSize: catalogsCache.size,
      nextUpdate: catalogsLastUpdated + CATALOGS_CACHE_DURATION,
      nextUpdateFormatted: new Date(catalogsLastUpdated + CATALOGS_CACHE_DURATION).toLocaleString('ru-RU')
    };

    return res.json({ success: true, data: cacheStatus });
  } catch (e) {
    console.error('Ошибка в GET /api/catalog/catalogs-status:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Глобальный поиск товаров по всем магазинам
router.get('/search-products', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchQuery = q.trim().toLowerCase();
    console.log(`🔍 Глобальный поиск товаров по запросу: "${searchQuery}"`);

    // Получаем список всех активных магазинов
    const shopsResult = await query(`
      SELECT shop_code, shop_name, address, city
      FROM shop_locations
      WHERE is_active = TRUE
      ORDER BY city ASC, shop_name ASC
    `);

    const shops = shopsResult.rows;
    console.log(`📍 Найдено ${shops.length} активных магазинов для поиска`);

    const results = [];
    const productMap = new Map(); // Для группировки товаров по ID

    // Проходим по каждому магазину (ТОЛЬКО используя кэш, без запросов к API)
    for (const shop of shops) {
      try {
        const shopId = shop.shop_code;

        // Получаем каталог магазина ТОЛЬКО из кэша
        const cachedCatalog = catalogsCache.get(shopId);
        let catalogData = null;

        if (cachedCatalog) {
          catalogData = cachedCatalog.data;
        } else {
          // Если нет в кэше, пропускаем этот магазин (не делаем запрос к API)
          console.log(`⚠️ Магазин ${shopId} не найден в кэше, пропускаем при поиске`);
          continue;
        }

        if (!catalogData || !catalogData.categories) {
          continue; // Пропускаем магазин без данных
        }

        // Функция для поиска товаров в категориях
        const searchInCategory = (category, path = []) => {
          const currentPath = [...path, { id: category.id, name: category.name }];

          // Ищем в товарах категории
          if (category.products && Array.isArray(category.products)) {
            for (const product of category.products) {
              if (product.name && product.name.toLowerCase().includes(searchQuery)) {
                const productKey = `${product.id || product.name}`;

                if (!productMap.has(productKey)) {
                  productMap.set(productKey, {
                    id: product.id,
                    name: product.name,
                    retail_price: product.retail_price,
                    quanty: product.quanty,
                    modifications: product.modifications,
                    categoryPath: currentPath,
                    shops: []
                  });
                }

                // Добавляем информацию о магазине
                const productData = productMap.get(productKey);
                productData.shops.push({
                  id: shopId,
                  name: shop.address || shop.shop_name,
                  shortName: shop.shop_name,
                  address: shop.address,
                  city: shop.city
                });
              }
            }
          }

          // Рекурсивно ищем в подкатегориях
          if (category.subcategories && Array.isArray(category.subcategories)) {
            for (const subcategory of category.subcategories) {
              searchInCategory(subcategory, currentPath);
            }
          }
        };

        // Ищем товары во всех категориях магазина
        for (const category of catalogData.categories) {
          searchInCategory(category);
        }

      } catch (shopError) {
        console.warn(`⚠️ Ошибка при поиске в магазине ${shop.shop_name}:`, shopError);
        continue; // Продолжаем с другими магазинами
      }
    }

    // Преобразуем Map в массив результатов
    const products = Array.from(productMap.values());

    // Сортируем по релевантности (товары, найденные в большем количестве магазинов - выше)
    products.sort((a, b) => {
      // Сначала по количеству магазинов (больше магазинов = выше)
      if (a.shops.length !== b.shops.length) {
        return b.shops.length - a.shops.length;
      }
      // Затем по названию
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ Найдено ${products.length} уникальных товаров по запросу "${searchQuery}"`);

    return res.json({
      success: true,
      data: products,
      total: products.length
    });

  } catch (e) {
    console.error('Ошибка в GET /api/catalog/search-products:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение информации о товаре по ID
router.get('/product/:productId', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { productId } = req.params;
    const { shop_code } = req.query; // Опционально: фильтр по магазину

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Не указан ID товара' });
    }

    let queryStr = `
      SELECT
        id, name, category_name, category_id, retail_price, quanty,
        characteristics, shop_code, shop_name, last_updated
      FROM catalog_products
      WHERE id = $1 AND is_active = TRUE
    `;
    let queryParams = [productId];

    // Если указан код магазина, добавляем фильтр
    if (shop_code) {
      queryStr += ' AND shop_code = $2';
      queryParams.push(shop_code);
    }

    queryStr += ' ORDER BY last_updated DESC LIMIT 10';

    const result = await query(queryStr, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }

    // Форматируем результат
    const products = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      categoryName: product.category_name,
      categoryId: product.category_id,
      retailPrice: product.retail_price,
      quantity: product.quanty,
      characteristics: product.characteristics || {},
      shop: {
        code: product.shop_code,
        name: product.shop_name
      },
      lastUpdated: product.last_updated
    }));

    // Если найден один товар, возвращаем его напрямую
    if (products.length === 1) {
      return res.json({ success: true, data: products[0] });
    }

    // Если найдено несколько товаров (в разных магазинах), возвращаем массив
    return res.json({ success: true, data: products });

  } catch (e) {
    console.error('Ошибка в GET /api/catalog/product/:productId:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка характеристик товара по ID (для обратной совместимости)
router.get('/product/:productId/characteristics', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { productId } = req.params;
    const { shop_code } = req.query;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Не указан ID товара' });
    }

    let queryStr = `
      SELECT characteristics
      FROM catalog_products
      WHERE id = $1 AND is_active = TRUE AND characteristics IS NOT NULL
    `;
    let queryParams = [productId];

    if (shop_code) {
      queryStr += ' AND shop_code = $2';
      queryParams.push(shop_code);
    }

    queryStr += ' LIMIT 1';

    const result = await query(queryStr, queryParams);

    if (result.rows.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const characteristics = result.rows[0].characteristics || {};

    // Преобразуем характеристики в удобный формат для выбора
    const formattedCharacteristics = {};
    Object.entries(characteristics).forEach(([key, value]) => {
      formattedCharacteristics[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        options: Array.isArray(value) ? value : [value]
      };
    });

    return res.json({ success: true, data: formattedCharacteristics });

  } catch (e) {
    console.error('Ошибка в GET /api/catalog/product/:productId/characteristics:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение модификаций товара по ID
router.get('/product/:productId/modifications', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { productId } = req.params;
    const { shop_code } = req.query;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Не указан ID товара' });
    }

    let queryStr = `
      SELECT modifications, name as product_name
      FROM catalog_products
      WHERE id = $1 AND is_active = TRUE
    `;
    let queryParams = [productId];

    if (shop_code) {
      queryStr += ' AND shop_code = $2';
      queryParams.push(shop_code);
    }

    queryStr += ' LIMIT 1';

    const result = await query(queryStr, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }

    const row = result.rows[0];
    const modifications = row.modifications || [];

    return res.json({
      success: true,
      data: {
        productId: productId,
        productName: row.product_name,
        modifications: modifications
      }
    });

  } catch (e) {
    console.error('Ошибка в GET /api/catalog/product/:productId/modifications:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение товаров для списания по коду магазина (для MDA магазинов)
router.get('/shop-products/:shopCode', authenticateTokenOrStatic, async (req, res) => {
  try {
    const { shopCode } = req.params;

    if (!shopCode) {
      return res.status(400).json({ success: false, message: 'Не указан код магазина' });
    }

    // Получаем товары для этого магазина
    const result = await query(`
      SELECT
        id, name, category_name as category, retail_price, quanty,
        characteristics, modifications
      FROM catalog_products
      WHERE shop_code = $1 AND is_active = TRUE
      ORDER BY category_name ASC, name ASC
    `, [shopCode]);

    const products = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      retailPrice: product.retail_price,
      quantity: product.quanty,
      characteristics: product.characteristics || {},
      modifications: product.modifications || []
    }));

    return res.json({
      success: true,
      data: products
    });

  } catch (e) {
    console.error('Ошибка в GET /api/catalog/shop-products/:shopCode:', e);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

export default router;


