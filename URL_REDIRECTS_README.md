# URL Redirects - Система редиректов для старых URL

## Описание проблемы

На старом сайте (`mda-medusa.ru`) пути категорий отличались от новых:
- **Старый**: `/catalog/vape_industriya/kartridzhi_ispariteli/...`
- **Новый**: `/catalog/vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/...`

## Решение

Реализована система автоматических редиректов, которая:
1. Перехватывает старые URL
2. Автоматически редиректит на новые
3. Поддерживает поиск товаров по slug (без параметра `pid`)

## Файлы изменений

### 1. `frontend/src/utils/urlRedirects.ts` - Конфигурация редиректов

```typescript
export const categoryRedirects: Record<string, string> = {
  // Картриджи испарители -> Картриджи испарители для под-систем
  'vape_industriya/kartridzhi_ispariteli/kartridzhi':
    'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/kartridzhi',
  'vape_industriya/kartridzhi_ispariteli':
    'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem',
};
```

### 2. `frontend/src/pages/CatalogHierarchicalV2.tsx` - Логика редиректа

Добавлена логика обработки:
- Редирект старых путей категорий
- Поиск товаров по slug (для старых URL без `pid`)
- Синхронизация с браузерной навигацией

## Как работает

### Пример 1: Редирект категории

**Старый URL (не работал):**
```
https://site.mda-platform.top/catalog/vape_industriya/kartridzhi_ispariteli/kartridzhi
```

**Автоматический редирект на:**
```
https://site.mda-platform.top/catalog/vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/kartridzhi
```

### Пример 2: Редирект товара

**Старый URL (открывал каталог):**
```
https://mda-medusa.ru/catalog/vape_industriya/kartridzhi_ispariteli/kartridzhi/kartridzh_justfog_minifit_s_0_2_om_1_9_ml/
```

**Теперь:**
1. Автоматический редирект пути категории
2. Поиск товара по slug: `kartridzh_justfog_minifit_s_0_2_om_1_9_ml`
3. Открытие модального окна товара

**Финальный URL:**
```
https://site.mda-platform.top/catalog/vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/kartridzhi/kartridzh_justfog_minifit_s_0_2_om_1_9_ml?pid=b814e480-0347-11ed-b781-00e04cb50794
```

## Как добавить новые редиректы

Откройте `frontend/src/utils/urlRedirects.ts` и добавьте в `categoryRedirects`:

```typescript
export const categoryRedirects: Record<string, string> = {
  // Существующие редиректы
  'vape_industriya/kartridzhi_ispariteli/kartridzhi':
    'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/kartridzhi',
  'vape_industriya/kartridzhi_ispariteli':
    'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem',

  // Добавьте свои редиректы здесь
  'old/category/path': 'new/category/path',
  'another/old/path': 'another/new/path',
};
```

**Важно:**
- Более специфичные пути должны быть ПЕРВЫМИ в списке
- Например, `vape_industriya/kartridzhi_ispariteli/kartridzhi` должен идти перед `vape_industriya/kartridzhi_ispariteli`

## Технические детали

### Backend: Генерация slug для товаров

Товары имеют slug в формате: `product_name_SHOPCODE`
- Скрипт: `backend/src/scripts/generateProductSlugs.ts`
- Автоматически запускается при деплое
- Поддерживает поиск по slug без shop_code (для старых URL)

### Функция `checkCategoryRedirect`

Проверяет URL на необходимость редиректа:
- Точное совпадение пути
- Проверка с учетом `/` (избегает частичных совпадений)
- Защита от двойного редиректа

### Функция `buildRedirectUrl`

Строит новый URL с замененным путем категории

### ProductModal

Поддерживает два способа загрузки:
1. По `productId` (предпочтительный)
2. По `productSlug` (для старых URL)

## Поддержка SEO

Все редиректы выполняются на клиенте через `navigate(..., { replace: true })`, что:
- Не создает записи в истории браузера
- Обновляет URL в адресной строке
- Сохраняет query параметры

## Логирование

В консоли браузера можно увидеть:
```
🔀 Redirecting from old URL: vape_industriya/kartridzhi_ispariteli → vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem
🔍 Old product URL detected, searching by slug: kartridzh_justfog_minifit_s_0_2_om_1_9_ml
```

## Деплой

После добавления новых редиректов:

1. **На MacBook:**
   ```bash
   ./deploy-push.sh
   ```

2. **На сервере:**
   ```bash
   ./deploy-server.sh
   ```

## Troubleshooting

### Редирект не работает

Проверьте:
1. Правильность написания старого пути в `categoryRedirects`
2. Порядок редиректов (более специфичные первыми)
3. Консоль браузера на наличие сообщений о редиректе

### Товар не открывается

Проверьте:
1. Slug товара генерируется правильно (используется функция `slugify`)
2. Backend endpoint `/catalog/products/slug/:slug` доступен
3. Товар существует в базе данных со slug

### Дублирование в URL

Это была исходная проблема! Исправлено в функции `checkCategoryRedirect`:
- Проверка на уже примененный редирект
- Правильная замена только начальной части пути

## Примечания

- Редиректы работают только на клиенте (React Router)
- Для серверных редиректов настройте nginx/apache
- Все старые URL товаров теперь работают через поиск по slug
