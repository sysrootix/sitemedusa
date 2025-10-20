# PM2 Конфигурация для Разработки

Этот проект настроен для одновременного запуска фронтенда и бэкенда в режиме разработки с помощью PM2.

## 🚀 Быстрый Старт

### Запуск всех сервисов
```bash
./pm2-dev.sh start
```

### Остановка всех сервисов
```bash
./pm2-dev.sh stop
```

### Перезапуск всех сервисов
```bash
./pm2-dev.sh restart
```

### Просмотр статуса процессов
```bash
./pm2-dev.sh status
```

### Просмотр логов
```bash
./pm2-dev.sh logs
```

## 🔧 Управление Отдельными Сервисами

### Фронтенд
```bash
# Запуск только фронтенда
./pm2-dev.sh frontend start

# Остановка фронтенда
./pm2-dev.sh frontend stop

# Перезапуск фронтенда
./pm2-dev.sh frontend restart

# Логи фронтенда
./pm2-dev.sh frontend logs
```

### Бэкенд
```bash
# Запуск только бэкенда
./pm2-dev.sh backend start

# Остановка бэкенда
./pm2-dev.sh backend stop

# Перезапуск бэкенда
./pm2-dev.sh backend restart

# Логи бэкенда
./pm2-dev.sh backend logs
```

## 📁 Структура Проекта

```
├── frontend/           # React + Vite (порт 3000)
├── backend/            # Node.js + Express (порт 5000)
├── ecosystem.config.js # Конфигурация PM2
├── pm2-dev.sh         # Скрипт управления
├── logs/              # Логи процессов
└── PM2_DEV_README.md  # Эта документация
```

## 🔍 Мониторинг

### Web-интерфейс PM2
```bash
pm2 monit
```

### Просмотр детальной информации
```bash
pm2 show frontend-dev
pm2 show backend-dev
```

## 📊 Логи

Логи сохраняются в папку `logs/`:
- `frontend-error.log` - ошибки фронтенда
- `frontend-out.log` - вывод фронтенда
- `backend-error.log` - ошибки бэкенда
- `backend-out.log` - вывод бэкенда

## 🛠️ Ручное Управление PM2

Если нужно использовать PM2 напрямую:

```bash
# Запуск
pm2 start ecosystem.config.js

# Остановка
pm2 stop ecosystem.config.js

# Перезапуск
pm2 restart ecosystem.config.js

# Удаление процессов
pm2 delete ecosystem.config.js

# Список всех процессов
pm2 list
```

## ⚙️ Конфигурация

Файл `ecosystem.config.js` содержит настройки для каждого сервиса:
- **frontend-dev**: React приложение на Vite (порт 3000)
- **backend-dev**: Node.js API сервер (порт 5000)

Каждый сервис настроен с:
- Автоматическим перезапуском при ошибках
- Ограничением памяти (1GB)
- Отдельными лог-файлами
- Переменными окружения для разработки

## 🐛 Устранение Неисправностей

### Если процессы не запускаются
1. Проверьте, установлены ли зависимости:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. Проверьте, свободны ли порты 3000 и 5000:
   ```bash
   lsof -i :3000
   lsof -i :5000
   ```

3. Проверьте логи:
   ```bash
   ./pm2-dev.sh logs
   ```

### Очистка PM2
Если возникли проблемы, очистите все процессы:
```bash
pm2 kill
pm2 list  # Должен показать пустой список
```

## 📝 Полезные Команды PM2

```bash
# Просмотр всех процессов
pm2 list

# Детальная информация о процессе
pm2 describe <name>

# Перезагрузка без остановки (graceful reload)
pm2 reload ecosystem.config.js

# Масштабирование процессов
pm2 scale frontend-dev 2

# Сохранение текущей конфигурации
pm2 save

# Автозапуск при перезагрузке системы
pm2 startup
pm2 save
```
