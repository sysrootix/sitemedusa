#!/bin/bash

# Скрипт для деплоя на Ubuntu сервере
# Скачивает изменения из git, устанавливает зависимости, собирает и запускает приложение

set -e  # Остановка при ошибке

echo "🚀 Деплой на Ubuntu сервере"
echo "============================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для цветного вывода
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Проверка, что мы в корне проекта
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Ошибка: Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Проверка наличия git
if ! command -v git &> /dev/null; then
    print_error "Git не установлен. Установите git: sudo apt install git"
    exit 1
fi

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js не установлен. Установите Node.js: https://nodejs.org/"
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    print_error "npm не установлен"
    exit 1
fi

# Шаг 1: Получение изменений из Git
echo ""
print_info "Шаг 1/8: Получение изменений из Git"
echo "-----------------------------------"

if [ -d ".git" ]; then
    # Сохранить локальные изменения если есть
    if ! git diff-index --quiet HEAD --; then
        print_warning "Обнаружены локальные изменения. Сохранение в stash..."
        git stash
    fi

    # Получить текущую ветку
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Текущая ветка: $CURRENT_BRANCH"

    # Pull изменений
    print_warning "Получение изменений..."
    git pull origin "$CURRENT_BRANCH" || {
        print_error "Ошибка при получении изменений из Git"
        exit 1
    }

    print_success "Изменения получены из Git"
else
    print_error "Это не git репозиторий. Сначала склонируйте проект."
    exit 1
fi

# Шаг 2: Установка зависимостей Backend
echo ""
print_info "Шаг 2/8: Установка зависимостей Backend"
echo "---------------------------------------"

cd backend

if [ ! -f "package.json" ]; then
    print_error "package.json не найден в директории backend"
    exit 1
fi

print_warning "Установка зависимостей backend..."


print_success "Зависимости backend установлены"

cd ..

# Шаг 3: Установка зависимостей Frontend
echo ""
print_info "Шаг 3/8: Установка зависимостей Frontend"
echo "---------------------------------------"

cd frontend

if [ ! -f "package.json" ]; then
    print_error "package.json не найден в директории frontend"
    exit 1
fi

print_warning "Установка зависимостей frontend..."


print_success "Зависимости frontend установлены"

cd ..

# Шаг 4: Сборка Backend
echo ""
print_info "Шаг 4/8: Сборка Backend"
echo "----------------------"

cd backend

print_warning "Сборка backend..."
npm run build || {
    print_error "Ошибка при сборке backend"
    exit 1
}

print_success "Backend собран"

# Шаг 5: Генерация slug для товаров
echo ""
print_info "Генерация slug для товаров (если нужно)..."
ts-node -r tsconfig-paths/register src/scripts/generateProductSlugs.ts || {
    print_warning "Не удалось запустить генерацию slug (возможно, уже есть)"
}

cd ..

# Шаг 6: Сборка Frontend
echo ""
print_info "Шаг 6/8: Сборка Frontend"
echo "-----------------------"

cd frontend

print_warning "Сборка frontend..."
npm run build || {
    print_error "Ошибка при сборке frontend"
    exit 1
}

print_success "Frontend собран"

cd ..

# Шаг 7: Проверка PM2
echo ""
print_info "Шаг 7/8: Управление PM2"
echo "----------------------"

if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 не установлен. Установка PM2 глобально..."
    npm install -g pm2 || {
        print_error "Не удалось установить PM2. Возможно нужны права sudo"
        print_info "Запустите: sudo npm install -g pm2"
        exit 1
    }
    print_success "PM2 установлен"
fi

# Шаг 8: Перезапуск приложений
echo ""
print_info "Шаг 8/8: Перезапуск приложений"
echo "-----------------------------"

# Проверка на наличие процессов "frontend-dev-site" и "backend-dev-site"
if pm2 list | grep -q "frontend-dev-site"; then
    print_warning "Перезапуск frontend-dev-site..."
    pm2 restart frontend-dev-site
else
    print_info "Запуск frontend через ecosystem.config.js"
    pm2 start ecosystem.config.js --only frontend
fi

if pm2 list | grep -q "backend-dev-site"; then
    print_warning "Перезапуск backend-dev-site..."
    pm2 restart backend-dev-site
else
    print_info "Запуск backend через ecosystem.config.js"
    pm2 start ecosystem.config.js --only backend
fi

pm2 save

print_success "Приложения запущены"

# Показать статус
echo ""
print_info "Статус приложений:"
pm2 list

echo ""
print_success "================================"
print_success "✨ Деплой успешно завершен!"
print_success "================================"

echo ""
print_info "Полезные команды PM2:"
echo "  pm2 list          - Список процессов"
echo "  pm2 logs          - Просмотр логов"
echo "  pm2 logs backend-dev-site  - Логи backend"
echo "  pm2 logs frontend-dev-site - Логи frontend"
echo "  pm2 restart all   - Перезапуск всех процессов"
echo "  pm2 stop all      - Остановка всех процессов"
echo "  pm2 monit         - Мониторинг в реальном времени"

echo ""
print_info "Для настройки автозапуска после перезагрузки сервера:"
echo "  pm2 startup"
echo "  pm2 save"