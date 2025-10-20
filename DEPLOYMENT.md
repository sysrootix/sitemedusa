# Инструкция по деплою

Этот документ описывает процесс деплоя проекта с MacBook на Ubuntu сервер.

## Структура проекта

- `frontend/` - React приложение (Vite)
- `backend/` - Node.js API (Express + TypeScript)
- `deploy-push.sh` - Скрипт для push в Git (запускается на MacBook)
- `deploy-server.sh` - Скрипт для деплоя на сервере (запускается на Ubuntu)

## Требования

### На MacBook (для разработки)
- Git
- Node.js >= 16
- npm

### На Ubuntu сервере
- Git
- Node.js >= 16
- npm
- PM2 (устанавливается автоматически скриптом)

## Процесс деплоя

### Шаг 1: Push изменений с MacBook

```bash
# Перейдите в корневую директорию проекта
cd /path/to/sitemda

# Запустите скрипт деплоя
./deploy-push.sh
```

Скрипт выполнит:
1. Инициализацию Git (если еще не инициализирован)
2. Создание .gitignore
3. Добавление всех файлов
4. Создание коммита
5. Push в удаленный репозиторий

При первом запуске вас попросят:
- URL Git репозитория (например: `git@github.com:username/sitemda.git`)
- Сообщение коммита (или можно оставить по умолчанию)

### Шаг 2: Деплой на Ubuntu сервере

#### Первичная настройка (только один раз)

```bash
# Подключитесь к серверу
ssh user@your-server.com

# Клонируйте репозиторий
git clone git@github.com:username/sitemda.git
cd sitemda

# Скопируйте .env файлы (если они не в Git)
# Создайте backend/.env с необходимыми переменными:
nano backend/.env
```

Пример `backend/.env`:
```env
NODE_ENV=production
PORT=50003
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
# ... другие переменные
```

```bash
# Создайте frontend/.env (если нужно)
nano frontend/.env
```

#### Деплой обновлений

```bash
# Перейдите в директорию проекта
cd /path/to/sitemda

# Запустите скрипт деплоя
./deploy-server.sh
```

Скрипт выполнит:
1. ✅ Git pull (получение изменений)
2. ✅ Установка зависимостей backend (`npm install`)
3. ✅ Установка зависимостей frontend (`npm install`)
4. ✅ Сборка backend (`npm run build`)
5. ✅ Сборка frontend (`npm run build`)
6. ✅ Установка PM2 (если не установлен)
7. ✅ Перезапуск приложений через PM2

### Режимы запуска

#### Development режим (по умолчанию)
```bash
./deploy-server.sh
```
Запустит:
- Backend: `npm run dev` на порту 50003
- Frontend: `npm run dev` на порту 50005

#### Production режим
```bash
NODE_ENV=production ./deploy-server.sh
```
Запустит:
- Backend: `npm run start:prod` (использует собранный dist/)
- Frontend: соберет в `frontend/dist/` (требует настройки nginx/apache)

## Управление PM2

После деплоя приложения управляются через PM2:

```bash
# Список процессов
pm2 list

# Просмотр логов
pm2 logs

# Логи конкретного процесса
pm2 logs backend-dev
pm2 logs frontend-dev

# Перезапуск
pm2 restart all
pm2 restart backend-dev

# Остановка
pm2 stop all
pm2 stop backend-dev

# Мониторинг в реальном времени
pm2 monit

# Сохранить конфигурацию для автозапуска
pm2 save

# Настроить автозапуск после перезагрузки
pm2 startup
```

## Настройка Nginx для Production

Для production режима необходимо настроить Nginx для обслуживания frontend:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (статические файлы)
    location / {
        root /path/to/sitemda/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:50003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Проверить конфигурацию Nginx
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Ошибка при git pull
```bash
# Если есть конфликты, сбросить локальные изменения
git reset --hard
git pull
```

### PM2 процессы не запускаются
```bash
# Проверить логи
pm2 logs

# Очистить все процессы и запустить заново
pm2 delete all
pm2 start ecosystem.config.js
```

### Ошибка прав доступа
```bash
# Дать права на выполнение скриптов
chmod +x deploy-push.sh deploy-server.sh
```

### Frontend не собирается
```bash
# Очистить кэш и переустановить зависимости
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Быстрый деплой

### С MacBook:
```bash
./deploy-push.sh
```

### На сервере:
```bash
./deploy-server.sh
```

Готово! 🚀

## Изменения в последнем деплое

### URL Redirects для категорий
Добавлена система редиректов для старых URL категорий:
- Файл: `frontend/src/utils/urlRedirects.ts`
- Автоматический редирект со старых путей на новые
- Например: `/catalog/vape_industriya/kartridzhi_ispariteli/...` → `/catalog/vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/...`

Чтобы добавить новые редиректы, отредактируйте `frontend/src/utils/urlRedirects.ts`:
```typescript
export const categoryRedirects: Record<string, string> = {
  'old/path': 'new/path',
  // добавьте свои редиректы здесь
};
```
