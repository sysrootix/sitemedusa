# Настройка Yandex Maps

## 1. Получение API ключа

1. Перейдите на [https://developer.tech.yandex.ru/](https://developer.tech.yandex.ru/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новое приложение в разделе "JavaScript API и HTTP Геокодер"
4. Скопируйте API ключ

## 2. Настройка переменных окружения

Создайте файл `.env` в папке `frontend/`:

```env
# Yandex Maps API Key
VITE_YANDEX_MAPS_API_KEY=ваш-api-ключ-здесь
```

## 3. Перезапуск приложения

После добавления API ключа перезапустите frontend:

```bash
cd /root/NikitaMDA/roznica/sites/osnova/frontend
npm run dev
```

## Особенности Yandex Maps:

- ✅ Более точные карты для России
- ✅ Русский язык интерфейса
- ✅ Группировка меток (кластеризация)
- ✅ Красивые баллуны с информацией
- ✅ Лучшая производительность для больших объемов данных
