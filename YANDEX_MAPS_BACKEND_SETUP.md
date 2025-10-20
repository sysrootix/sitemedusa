# Настройка Yandex Maps на бэкенде

## 1. Переменные окружения

Добавьте в файл `.env` в папке `backend/`:

```env
# Yandex Maps API Key
YANDEX_MAPS_API_KEY=ваш-yandex-maps-api-ключ
```

## 2. Перезапуск сервера

```bash
cd /root/NikitaMDA/roznica/sites/osnova/backend
npm run dev
```

## 3. Доступные эндпоинты

После настройки будут доступны:

### Статические изображения карт
```
GET /api/maps/static?ll=135.0716,48.4802&z=10&size=400,300
```

### Геокодирование
```
GET /api/maps/geocode?ll=135.0716,48.4802
```

### Прокси JavaScript API (если нужно)
```
GET /api/maps/js-api
```

## 4. Безопасность

✅ **API ключ скрыт** - не раскрывается на клиенте
✅ **Кеширование** - изображения кешируются на 1 час
✅ **Rate limiting** - защита от злоупотреблений
✅ **CORS** - разрешены запросы с фронтенда

## 5. Использование в фронтенде

Теперь вместо прямого обращения к Yandex Maps API используйте:

```javascript
// Получение статического изображения карты
const mapImageUrl = `/api/maps/static?ll=${longitude},${latitude}&z=12&size=600,400`;

// Геокодирование
const response = await api.get(`/maps/geocode?ll=${longitude},${latitude}`);
```

Это обеспечивает безопасность и контроль над API запросами! 🔒🗺️
