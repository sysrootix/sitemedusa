#!/bin/bash

# Скрипт для деплоя с MacBook
# Пушит изменения в git репозиторий

set -e  # Остановка при ошибке

echo "🚀 Деплой с MacBook - Push в Git"
echo "================================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Проверка, что мы в корне проекта
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Ошибка: Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Инициализация git если еще не инициализирован
if [ ! -d ".git" ]; then
    print_warning "Git репозиторий не найден. Инициализация..."
    git init
    print_success "Git репозиторий инициализирован"

    # Запросить URL удаленного репозитория
    echo ""
    echo "Введите URL git репозитория (например: git@github.com:username/repo.git):"
    read REPO_URL

    if [ -z "$REPO_URL" ]; then
        print_error "URL репозитория не указан"
        exit 1
    fi

    git remote add origin "$REPO_URL"
    print_success "Удаленный репозиторий добавлен: $REPO_URL"
fi

# Создать .gitignore если его нет
if [ ! -f ".gitignore" ]; then
    print_warning "Создание .gitignore файла..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Build outputs
frontend/dist/
backend/dist/

# Environment variables
.env
.env.local
.env.production
*/.env
*/.env.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*/logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# PM2
.pm2/

# Certificates (if sensitive)
certs/*.key
certs/*.pem

# Temporary files
*.tmp
*.temp

# Database
*.db
*.sqlite
EOF
    print_success ".gitignore создан"
fi

# Показать статус
echo ""
echo "📊 Статус Git:"
git status

# Добавить все файлы
echo ""
print_warning "Добавление файлов в индекс..."
git add .

# Запросить commit message
echo ""
echo "Введите сообщение коммита (или Enter для значения по умолчанию):"
read COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Deploy: URL redirects for old category paths"
fi

# Сделать коммит
echo ""
print_warning "Создание коммита..."
git commit -m "$COMMIT_MSG" || {
    print_warning "Нет изменений для коммита или коммит не удался"
}

# Определить текущую ветку
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# Если это первый коммит, установить ветку в main
if [ "$CURRENT_BRANCH" = "HEAD" ] || [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
    git branch -M main
    print_success "Установлена ветка: main"
fi

# Запросить подтверждение перед push
echo ""
echo "Готов к push в ветку: $CURRENT_BRANCH"
echo "Продолжить? (y/n):"
read CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    print_warning "Push отменен"
    exit 0
fi

# Push в удаленный репозиторий
echo ""
print_warning "Push изменений в удаленный репозиторий..."
git push -u origin "$CURRENT_BRANCH" || {
    print_error "Ошибка при push. Возможно нужно настроить SSH ключ или права доступа."
    exit 1
}

print_success "Изменения успешно отправлены в Git!"
echo ""
echo "✨ Деплой завершен!"
echo "Теперь можно запустить deploy-server.sh на сервере"
