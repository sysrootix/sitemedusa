# 📦 Catalog System Setup Guide

Полное руководство по настройке и использованию системы каталога с интеграцией 1С.

## 📋 Содержание

- [Обзор системы](#обзор-системы)
- [Установка](#установка)
- [Настройка](#настройка)
- [Использование API](#использование-api)
- [Фронтенд](#фронтенд)
- [Автообновление](#автообновление)
- [Устранение неполадок](#устранение-неполадок)

---

## 🎯 Обзор системы

Система каталога автоматически синхронизирует данные о товарах из 1С и предоставляет удобный API для работы с каталогом.

### Основные возможности:

- ✅ Автоматическая синхронизация с 1С каждые 30 минут
- ✅ Поддержка нескольких магазинов
- ✅ Иерархические категории товаров
- ✅ Модификации товаров (вкусы, цвета и т.д.)
- ✅ Исключения товаров/категорий
- ✅ Полнотекстовый поиск
- ✅ История синхронизации
- ✅ Очистка названий товаров

---

## 🚀 Установка

### 1. Запустите миграцию базы данных

```bash
cd backend
./run_catalog_migration.sh
```

Миграция создаст следующие таблицы:
- `shop_locations` - информация о магазинах
- `catalog_products` - товары с привязкой к магазинам
- `catalog_exclusions` - исключенные товары/категории
- `catalog_sync_log` - логи синхронизации

### 2. Настройте переменные окружения

Создайте/обновите файл `.env` в папке `backend`:

```env
# 1C Balance API Configuration
BALANCE_API_USERNAME=ТерехинНА
BALANCE_API_PASSWORD=123455123
BALANCE_API_URL=https://cloud.mda-medusa.ru/mda-trade/hs/Api/BalanceData

# Certificate Configuration
BALANCE_API_CERT_PATH=./routes/certs/terehin_n.cloud.mda-medusa.ru.p12
BALANCE_API_CERT_PASSWORD=000000000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 3. Разместите сертификат

Скопируйте файл `terehin_n.cloud.mda-medusa.ru.p12` в папку:
```
backend/routes/certs/
```

### 4. Установите зависимости

```bash
cd backend
npm install node-forge node-cron

cd ../frontend
# Зависимости уже установлены
```

### 5. Запустите сервер

```bash
cd backend
npm run dev
```

При запуске:
- ✅ Инициализируется cron задача (каждые 30 минут)
- ✅ Запускается первая синхронизация через 10 секунд
- ✅ Выводится информация в консоль

---

## ⚙️ Настройка

### Добавление магазина

```sql
INSERT INTO shop_locations (
    shop_code, 
    shop_name, 
    address, 
    city, 
    phone, 
    working_hours,
    priority_order,
    is_active
) VALUES (
    '13',
    'Калинина 10',
    'ул. Калинина, 10',
    'Москва',
    '+7 (495) 123-45-67',
    'Пн-Вс: 10:00-22:00',
    0,
    TRUE
);
```

### Добавление исключения

Через API (требуется аутентификация):

```bash
curl -X POST http://localhost:55001/api/catalog-shops/exclusions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exclusion_type": "product",
    "item_id": "550e8400-e29b-41d4-a716-446655440000",
    "reason": "Товар снят с производства"
  }'
```

---

## 🌐 Использование API

### Публичные эндпоинты

#### Получить список магазинов
```http
GET /api/catalog-shops/shops
GET /api/catalog-shops/shops?city=Москва
```

Ответ:
```json
{
  "success": true,
  "data": {
    "shops": [
      {
        "shop_code": "13",
        "shop_name": "Калинина 10",
        "address": "ул. Калинина, 10",
        "city": "Москва",
        "phone": "+7 (495) 123-45-67",
        "working_hours": "Пн-Вс: 10:00-22:00"
      }
    ]
  }
}
```

#### Получить каталог магазина
```http
GET /api/catalog-shops/shops/{shopCode}/catalog
```

Ответ:
```json
{
  "success": true,
  "data": {
    "shop": {
      "shop_code": "13",
      "shop_name": "Калинина 10",
      "address": "ул. Калинина, 10",
      "city": "Москва"
    },
    "categories": [
      {
        "id": "cat-001",
        "name": "Электронные сигареты",
        "products": [
          {
            "id": "prod-001",
            "name": "VAPE Pod System",
            "retail_price": 2500.00,
            "quanty": 10,
            "modifications": [
              {
                "id": "mod-001",
                "name": "Черный",
                "quanty": 5,
                "retail_price": 2500.00
              },
              {
                "id": "mod-002",
                "name": "Белый",
                "quanty": 5,
                "retail_price": 2500.00
              }
            ]
          }
        ]
      }
    ],
    "total_products": 150,
    "total_categories": 8
  }
}
```

#### Поиск товаров
```http
GET /api/catalog-shops/search?q=vape
GET /api/catalog-shops/search?q=vape&shop_code=13&limit=20
```

Ответ:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-001",
        "name": "VAPE Pod System",
        "category_name": "Электронные сигареты",
        "shops": [
          {
            "shop_code": "13",
            "shop_name": "Калинина 10",
            "quantity": 10,
            "price": 2500.00
          }
        ]
      }
    ],
    "total": 1
  }
}
```

### Защищенные эндпоинты (требуется JWT)

#### Запустить синхронизацию магазина
```http
POST /api/catalog-shops/shops/{shopCode}/sync
Authorization: Bearer YOUR_JWT_TOKEN
```

Ответ:
```json
{
  "success": true,
  "message": "Catalog sync started",
  "data": {
    "shop_code": "13",
    "status": "started"
  }
}
```

#### Запустить синхронизацию всех магазинов
```http
POST /api/catalog-shops/sync-all
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Получить статус синхронизации
```http
GET /api/catalog-shops/sync-status
GET /api/catalog-shops/sync-status?shop_code=13&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

Ответ:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-001",
        "shop_code": "13",
        "sync_type": "scheduled",
        "status": "success",
        "products_synced": 150,
        "products_added": 5,
        "products_updated": 140,
        "products_deactivated": 5,
        "duration_ms": 5234,
        "started_at": "2025-01-15T10:00:00Z",
        "completed_at": "2025-01-15T10:00:05Z"
      }
    ]
  }
}
```

---

## 💻 Фронтенд

### Использование в React

```tsx
import api from '@/services/api';

// Получить магазины
const shops = await api.getCatalogShops();

// Получить каталог магазина
const catalog = await api.getShopCatalog('13');

// Поиск товаров
const searchResults = await api.searchCatalogProducts('vape', '13', 20);

// Синхронизация (требует авторизации)
await api.syncShopCatalog('13');
await api.syncAllCatalogs();
```

### Существующая страница каталога

Страница каталога уже существует в `frontend/src/pages/Catalog.tsx` и использует старое API.

Чтобы переключиться на новое API магазинов, создайте новую страницу или обновите существующую для работы с `api.getCatalogShops()` и `api.getShopCatalog()`.

---

## ⏰ Автообновление

Система автоматически синхронизирует каталоги:

- **Частота**: Каждые 30 минут
- **Первый запуск**: Через 10 секунд после старта сервера
- **Триггер**: Cron задача в `catalogCronService.ts`

### Логи синхронизации

```
⏰ Scheduled catalog sync triggered
🔄 Starting catalog sync for all active shops
📍 Found 3 active shops to sync
🔄 Starting catalog sync for shop 13
✅ Catalog sync completed for shop Калинина 10 in 5234ms
✅ Scheduled sync completed: 3 successful, 0 failed
```

### Ручная синхронизация

```bash
# Через API
curl -X POST http://localhost:55001/api/catalog-shops/sync-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Устранение неполадок

### Проблема: Синхронизация не работает

**Решение:**
1. Проверьте логи сервера:
   ```bash
   tail -f backend/logs/combined.log
   ```

2. Убедитесь, что сертификат на месте:
   ```bash
   ls -la backend/routes/certs/
   ```

3. Проверьте переменные окружения:
   ```bash
   cat backend/.env | grep BALANCE_API
   ```

### Проблема: Пустой каталог

**Решение:**
1. Проверьте, что магазин активен:
   ```sql
   SELECT * FROM shop_locations WHERE is_active = TRUE;
   ```

2. Проверьте логи синхронизации:
   ```sql
   SELECT * FROM catalog_sync_log 
   ORDER BY started_at DESC LIMIT 10;
   ```

3. Запустите ручную синхронизацию:
   ```bash
   curl -X POST http://localhost:55001/api/catalog-shops/shops/13/sync \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Проблема: Ошибка сертификата

**Решение:**
1. Убедитесь, что пароль сертификата правильный
2. Проверьте формат файла (.p12)
3. Попробуйте запустить без сертификата (для тестирования)

### Проблема: Товары не отображаются

**Решение:**
1. Проверьте исключения:
   ```sql
   SELECT * FROM catalog_exclusions WHERE is_active = TRUE;
   ```

2. Проверьте, что товары активны:
   ```sql
   SELECT COUNT(*) FROM catalog_products 
   WHERE shop_code = '13' AND is_active = TRUE;
   ```

---

## 📊 Полезные SQL запросы

### Статистика по магазинам
```sql
SELECT 
    sl.shop_name,
    COUNT(DISTINCT cp.id) as total_products,
    COUNT(DISTINCT cp.category_name) as total_categories,
    SUM(cp.quanty) as total_quantity
FROM shop_locations sl
LEFT JOIN catalog_products cp ON sl.shop_code = cp.shop_code AND cp.is_active = TRUE
WHERE sl.is_active = TRUE
GROUP BY sl.shop_name
ORDER BY total_products DESC;
```

### Топ товаров по наличию
```sql
SELECT 
    name,
    category_name,
    COUNT(*) as shop_count,
    SUM(quanty) as total_quantity
FROM catalog_products
WHERE is_active = TRUE
GROUP BY name, category_name
HAVING SUM(quanty) > 0
ORDER BY total_quantity DESC
LIMIT 10;
```

### Товары с низким остатком
```sql
SELECT 
    cp.name,
    cp.category_name,
    cp.quanty,
    sl.shop_name
FROM catalog_products cp
JOIN shop_locations sl ON cp.shop_code = sl.shop_code
WHERE cp.is_active = TRUE 
  AND cp.quanty > 0 
  AND cp.quanty < 5
ORDER BY cp.quanty ASC;
```

### История синхронизации (последние 24 часа)
```sql
SELECT 
    shop_code,
    status,
    products_synced,
    products_added,
    products_updated,
    products_deactivated,
    duration_ms,
    started_at,
    error_message
FROM catalog_sync_log
WHERE started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

---

## 🎉 Готово!

Система каталога настроена и готова к использованию!

### Следующие шаги:

1. ✅ Добавьте свои магазины в `shop_locations`
2. ✅ Запустите первую синхронизацию
3. ✅ Проверьте данные через API
4. ✅ Интегрируйте на фронтенде
5. ✅ Настройте исключения (при необходимости)

### Поддержка

При возникновении проблем:
- Проверьте логи: `backend/logs/`
- Изучите таблицу `catalog_sync_log`
- Обратитесь к разработчику

**Удачи! 🚀**

