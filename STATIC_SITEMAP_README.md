# Статические Sitemap файлы

Инструкция по копированию sitemap файлов со старого сайта на новый.

## Где хранятся файлы

Все статические sitemap файлы должны быть размещены в:
```
frontend/public/
```

Файлы из этой папки будут доступны напрямую по URL после деплоя.

## Список файлов

- `sitemap-iblock-11.xml` - Магазины
- `sitemap-iblock-31.xml` - Другие данные
- `sitemap-iblock-39.xml` - Другие данные
- `sitemap-iblock-40.xml` - Другие данные

## Способ 1: Автоматическое копирование (Рекомендуется)

Используйте скрипт для автоматического скачивания и замены доменов:

```bash
./copy-sitemaps.sh
```

Скрипт выполнит:
1. ✅ Скачает sitemap файлы со старого сайта
2. ✅ Заменит старый домен на новый
3. ✅ Сохранит в `frontend/public/`

## Способ 2: Ручное копирование

### Шаг 1: Скачать файлы со старого сайта

```bash
# Скачать sitemap-iblock-11.xml
curl https://mda-medusa.ru/sitemap-iblock-11.xml -o frontend/public/sitemap-iblock-11.xml

# Скачать sitemap-iblock-31.xml
curl https://mda-medusa.ru/sitemap-iblock-31.xml -o frontend/public/sitemap-iblock-31.xml

# Скачать sitemap-iblock-39.xml
curl https://mda-medusa.ru/sitemap-iblock-39.xml -o frontend/public/sitemap-iblock-39.xml

# Скачать sitemap-iblock-40.xml
curl https://mda-medusa.ru/sitemap-iblock-40.xml -o frontend/public/sitemap-iblock-40.xml
```

### Шаг 2: Заменить домены в файлах

```bash
# macOS
sed -i '' 's|https://mda-medusa.ru|https://site.mda-platform.top|g' frontend/public/sitemap-iblock-*.xml

# Linux
sed -i 's|https://mda-medusa.ru|https://site.mda-platform.top|g' frontend/public/sitemap-iblock-*.xml
```

### Шаг 3: Проверить файлы

```bash
# Посмотреть содержимое
cat frontend/public/sitemap-iblock-11.xml

# Проверить что домен заменился
grep "mda-medusa.ru" frontend/public/sitemap-iblock-*.xml
# Не должно быть результатов

grep "site.mda-platform.top" frontend/public/sitemap-iblock-*.xml
# Должны быть результаты
```

## После деплоя

Файлы будут доступны по следующим URL:

- `https://site.mda-platform.top/sitemap-iblock-11.xml`
- `https://site.mda-platform.top/sitemap-iblock-31.xml`
- `https://site.mda-platform.top/sitemap-iblock-39.xml`
- `https://site.mda-platform.top/sitemap-iblock-40.xml`

## Проверка после деплоя

```bash
# Проверить что файлы доступны
curl https://site.mda-platform.top/sitemap-iblock-11.xml
curl https://site.mda-platform.top/sitemap-iblock-31.xml
curl https://site.mda-platform.top/sitemap-iblock-39.xml
curl https://site.mda-platform.top/sitemap-iblock-40.xml
```

## Структура файла

Пример sitemap файла:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://site.mda-platform.top/some-page/</loc>
    <lastmod>2024-08-15T04:09:16-04:00</lastmod>
  </url>
  <url>
    <loc>https://site.mda-platform.top/another-page/</loc>
    <lastmod>2024-08-15T04:08:30-04:00</lastmod>
  </url>
</urlset>
```

## Важно

- ✅ Все URL должны быть с новым доменом `site.mda-platform.top`
- ✅ Формат XML должен быть валидным
- ✅ Файлы должны быть в `frontend/public/` перед деплоем
- ✅ После изменения нужно пересобрать frontend (`npm run build`)

## Обновление sitemap

Если нужно обновить sitemap файлы:

1. Запустите скрипт `./copy-sitemaps.sh` заново
2. Или отредактируйте файлы вручную в `frontend/public/`
3. Задеплойте изменения:
   ```bash
   ./deploy-push.sh      # На MacBook
   ./deploy-server.sh    # На сервере
   ```

## Альтернатива: Динамические sitemap

Для автоматического обновления sitemap используйте динамические sitemap из backend:
- `/sitemap-shops.xml` - Генерируется автоматически из БД
- `/sitemap-products.xml` - Генерируется автоматически из БД
- `/sitemap-categories.xml` - Генерируется автоматически из БД

См. `SITEMAP_README.md` для подробностей.

## Troubleshooting

### Файл не отображается после деплоя

1. Проверьте что файл есть в `frontend/public/`:
   ```bash
   ls -la frontend/public/sitemap-*.xml
   ```

2. Проверьте что frontend пересобран:
   ```bash
   cd frontend
   npm run build
   ls -la dist/sitemap-*.xml
   ```

3. На сервере проверьте папку dist:
   ```bash
   ls -la /path/to/project/frontend/dist/sitemap-*.xml
   ```

### Nginx не отдает файлы

Добавьте в nginx конфигурацию:
```nginx
location ~* \.xml$ {
    root /path/to/project/frontend/dist;
    add_header Content-Type application/xml;
}
```

### Неправильный домен в файлах

Запустите скрипт замены заново:
```bash
./copy-sitemaps.sh
```
