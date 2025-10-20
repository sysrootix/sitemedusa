# Medusa Vape Shop - Backend API

Профессиональный backend API для интернет-магазина Medusa Vape Shop с авторизацией через Telegram Bot.

## 🚀 Возможности

- ✅ **Авторизация через Telegram** - Безопасная аутентификация пользователей
- ✅ **JWT токены** - Статeless авторизация с refresh токенами
- ✅ **PostgreSQL** - Надежная реляционная база данных
- ✅ **TypeScript** - Полная типизация для безопасности кода
- ✅ **Валидация данных** - Express-validator для проверки входных данных
- ✅ **Rate Limiting** - Защита от спама и DDoS атак
- ✅ **Логирование** - Winston для профессионального логирования
- ✅ **Безопасность** - Helmet, CORS, сжатие и другие middleware
- ✅ **Graceful Shutdown** - Корректное завершение работы сервера

## 📋 Требования

- Node.js 18+
- PostgreSQL 12+
- npm или yarn

## ⚙️ Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd backend
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. **Настройте базу данных:**
```bash
# Создайте базу данных PostgreSQL
createdb medusa_vape_shop

# Запустите миграции (в dev режиме происходит автоматически)
npm run db:migrate
```

5. **Запустите сервер:**
```bash
# Режим разработки
npm run dev

# Продакшн режим
npm run build
npm start
```

## 🔧 Настройка Telegram Bot

1. **Создайте бота:**
   - Напишите @BotFather в Telegram
   - Выполните команду `/newbot`
   - Следуйте инструкциям для создания бота
   - Получите токен бота

2. **Настройте переменные окружения:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
```

3. **Настройте домен для Telegram Login:**
   - В @BotFather выполните `/setdomain`
   - Укажите домен вашего frontend приложения

## 🌐 API Endpoints

### Авторизация
- `POST /api/auth/telegram` - Авторизация через Telegram
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получение профиля пользователя
- `GET /api/auth/verify` - Проверка токена
- `GET /api/auth/telegram/status` - Статус Telegram бота

### Пользователи
- `GET /api/users` - Получение всех пользователей (админ)
- `GET /api/users/stats` - Статистика пользователей (админ)
- `GET /api/users/:id` - Получение профиля пользователя
- `PUT /api/users/:id` - Обновление профиля
- `DELETE /api/users/:id` - Деактивация аккаунта
- `PATCH /api/users/:id/role` - Изменение роли (админ)
- `PATCH /api/users/:id/activate` - Активация пользователя (админ)

### Система
- `GET /api/health` - Проверка здоровья сервера
- `GET /api/` - Информация об API

## 🔐 Переменные окружения

```env
# Сервер
NODE_ENV=development
PORT=55001
HOST=localhost

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medusa_vape_shop
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# Безопасность
BCRYPT_ROUNDS=12
COOKIE_SECRET=your-cookie-secret

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 🗃️ Структура проекта

```
src/
├── config/          # Конфигурация приложения
├── controllers/     # Контроллеры API
├── middleware/      # Middleware функции
├── models/          # Модели базы данных
├── routes/          # Маршруты API
├── services/        # Бизнес логика
├── types/           # TypeScript типы
├── utils/           # Утилиты
└── index.ts         # Точка входа
```

## 🔍 Скрипты

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшна
npm start            # Запуск продакшн сервера
npm run db:migrate   # Запуск миграций
npm run db:seed      # Наполнение БД тестовыми данными
npm run clean        # Очистка build папки
```

## 📊 Логирование

Логи сохраняются в папке `logs/`:
- `app.log` - Все логи приложения
- `error.log` - Только ошибки
- `exceptions.log` - Необработанные исключения
- `rejections.log` - Необработанные Promise rejections

## 🛡️ Безопасность

- **Helmet** - Защита от распространенных уязвимостей
- **CORS** - Настроенная политика CORS
- **Rate Limiting** - Ограничение запросов
- **Input Validation** - Валидация всех входных данных
- **JWT токены** - Безопасная авторизация
- **HTTP-only cookies** - Защищенное хранение токенов

## 🚀 Развертывание

### Docker (рекомендуется)

1. **Создайте Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 55001
CMD ["npm", "start"]
```

2. **Запустите:**
```bash
docker build -t medusa-vape-api .
docker run -p 55001:55001 medusa-vape-api
```

### PM2 (альтернатива)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "medusa-api"
```

## 🐛 Отладка

```bash
# Включить debug логи
DEBUG=* npm run dev

# Проверить здоровье API
curl http://localhost:55001/api/health

# Проверить статус Telegram бота
curl http://localhost:55001/api/auth/telegram/status
```

## 📝 Лицензия

MIT License

## 🤝 Поддержка

Если у вас есть вопросы или проблемы:
- Создайте issue в репозитории
- Напишите на support@medusa-vape.ru
- Telegram: @medusa_support
