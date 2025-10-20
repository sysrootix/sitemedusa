
# 🚀 Medusa Vape Shop Backend

## Быстрый старт

1. **Установите PostgreSQL** и создайте базу данных:
```bash
createdb medusa_vape_shop
```

2. **Скопируйте .env файл:**
```bash
cp .env.example .env
```

3. **Отредактируйте .env файл** с вашими настройками:
- DB_PASSWORD - пароль от PostgreSQL
- TELEGRAM_BOT_TOKEN - токен вашего Telegram бота
- TELEGRAM_BOT_USERNAME - имя пользователя бота

4. **Запустите сервер:**
```bash
npm run dev
```

Сервер будет доступен на http://localhost:55001

## API Endpoints:
- GET /api/health - Проверка здоровья сервера
- GET /api/ - Информация об API
- POST /api/auth/telegram - Авторизация через Telegram
- GET /api/auth/me - Получение профиля пользователя

