# Sitemap Documentation

Система генерации XML sitemap для SEO оптимизации сайта.

## Доступные sitemap файлы

### Основной индекс
- **URL**: `https://site.mda-platform.top/sitemap.xml`
- **Описание**: Главный sitemap индекс, содержит ссылки на все остальные sitemap файлы

### Отдельные sitemap файлы

1. **Статические страницы**
   - URL: `https://site.mda-platform.top/sitemap-static.xml`
   - Содержит: Главная, О нас, Контакты, Статьи, Вакансии и т.д.

2. **Магазины**
   - URL: `https://site.mda-platform.top/sitemap-shops.xml`
   - Содержит: Все активные магазины из базы данных

3. **Категории**
   - URL: `https://site.mda-platform.top/sitemap-categories.xml`
   - Содержит: Все категории каталога с иерархией

4. **Товары**
   - URL: `https://site.mda-platform.top/sitemap-products.xml`
   - Содержит: До 10,000 товаров (без дубликатов)

### Legacy формат (совместимость со старым сайтом)

**Sitemap для магазинов в старом формате**
- URL: `https://site.mda-platform.top/sitemap-iblock-11.xml`
- Формат URL: `/contacts/stores/{shop_code}/`
- Это для совместимости со старым сайтом

## Структура файлов

### Backend

```
backend/src/
├── controllers/
│   └── sitemapController.ts      # Контроллер генерации sitemap
└── routes/
    └── sitemap.ts                 # Роуты для sitemap
```

### Методы контроллера

- `getSitemapIndex()` - Главный индекс
- `getSitemapStatic()` - Статические страницы
- `getSitemapShops()` - Магазины
- `getSitemapCategories()` - Категории
- `getSitemapProducts()` - Товары
- `getLegacySitemapShops()` - Legacy формат магазинов

## Конфигурация

### Backend (.env)

```env
# URL фронтенда для генерации sitemap
FRONTEND_URL=https://site.mda-platform.top
```

Если переменная не установлена, используется значение по умолчанию.

## Особенности реализации

### 1. Генерация URL товаров

Товары в sitemap имеют полные иерархические URL:
```
https://site.mda-platform.top/catalog/vape_industriya/kartridzhi/product-slug
```

- Slug без суффикса shop_code (для уникальности в sitemap)
- Категории в иерархическом формате
- Загрузка карточки производится по slug без дополнительных параметров

### 2. Удаление дубликатов

Товары могут быть в нескольких магазинах, но в sitemap каждый товар появляется только один раз (группировка по `name`).

### 3. Лимиты

- Товары: максимум 10,000 записей в sitemap
- Сортировка: по дате обновления (новые первыми)

### 4. Приоритеты (priority)

- Главная страница: 1.0
- Каталог: 0.9
- Категории: 0.8
- Магазины: 0.7
- Статические страницы: 0.6-0.7
- Товары: 0.6

### 5. Частота обновления (changefreq)

- Товары: daily
- Категории: weekly
- Статические страницы: weekly
- Магазины: monthly

## Как добавить новые sitemap файлы

### Шаг 1: Добавить метод в контроллер

`backend/src/controllers/sitemapController.ts`:

```typescript
public async getSitemapArticles(req: Request, res: Response): Promise<void> {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://site.mda-platform.top';

    const articles = await sequelize.query(
      `SELECT id, title, slug, updated_at
       FROM articles
       WHERE is_published = TRUE
       ORDER BY updated_at DESC`,
      { type: QueryTypes.SELECT }
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const article of articles) {
      xml += `
  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    logger.error('Error generating articles sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
```

### Шаг 2: Добавить роут

`backend/src/routes/sitemap.ts`:

```typescript
router.get(/^\/sitemap-articles\.xml$/, (req, res) =>
  sitemapController.getSitemapArticles(req, res)
);
```

### Шаг 3: Добавить в индекс

`backend/src/controllers/sitemapController.ts` в методе `getSitemapIndex()`:

```xml
<sitemap>
  <loc>${baseUrl}/sitemap-articles.xml</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
</sitemap>
```

## Тестирование

### Локально

```bash
# Запустить backend
cd backend
npm run dev

# Проверить sitemap
curl http://localhost:50003/sitemap.xml
curl http://localhost:50003/sitemap-shops.xml
curl http://localhost:50003/sitemap-iblock-11.xml
```

### На production

```bash
curl https://site.mda-platform.top/sitemap.xml
curl https://site.mda-platform.top/sitemap-iblock-11.xml
```

## Интеграция с Google Search Console

1. Перейдите в [Google Search Console](https://search.google.com/search-console)
2. Выберите ваш сайт
3. В меню слева выберите "Sitemaps"
4. Добавьте URL: `sitemap.xml`
5. Нажмите "Submit"

Google автоматически найдет все подсitemap из индекса.

## Проверка валидности

Используйте онлайн валидаторы:
- https://www.xml-sitemaps.com/validate-xml-sitemap.html
- https://www.websiteplanet.com/webtools/sitemap-validator/

## Обновление sitemap

Sitemap генерируются динамически при каждом запросе, поэтому:
- Всегда актуальные данные
- Нет необходимости в кешировании или cron задачах
- Автоматическое обновление при изменении данных в БД

## Nginx конфигурация (опционально)

Если хотите кешировать sitemap на уровне nginx:

```nginx
location ~* ^/sitemap.*\.xml$ {
    proxy_pass http://localhost:50003;
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;  # Кеш на 1 час
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Troubleshooting

### Sitemap возвращает 404

Проверьте:
1. Backend запущен
2. Роуты зарегистрированы в `backend/src/index.ts`
3. URL точно соответствует паттерну (например, `/sitemap.xml` а не `/sitemap`)

### Пустой sitemap

Проверьте:
1. Данные есть в базе данных
2. Таблицы `is_active = TRUE`
3. Логи backend на наличие ошибок

### Legacy sitemap не работает

Убедитесь что:
1. Роут `/sitemap-iblock-11.xml` зарегистрирован
2. Таблица `shop_locations` содержит данные
3. FRONTEND_URL правильно настроен в .env

## Дополнительные ресурсы

- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Sitemap Best Practices](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#general-guidelines)
