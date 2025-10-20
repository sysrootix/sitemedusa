#!/bin/bash

# Скрипт для управления pm2 процессами разработки
# Использование: ./pm2-dev.sh [start|stop|restart|status|logs|delete]

ACTION=${1:-status}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$PROJECT_DIR"

case $ACTION in
    start)
        echo "🚀 Запуск фронтенда и бэкенда в режиме разработки..."
        pm2 start ecosystem.config.js
        echo "✅ Сервисы запущены!"
        echo "📊 Статус процессов:"
        pm2 list
        ;;
    stop)
        echo "⏹️  Остановка всех процессов..."
        pm2 stop ecosystem.config.js
        echo "✅ Все процессы остановлены!"
        ;;
    restart)
        echo "🔄 Перезапуск всех процессов..."
        pm2 restart ecosystem.config.js
        echo "✅ Все процессы перезапущены!"
        ;;
    status)
        echo "📊 Статус процессов:"
        pm2 list
        ;;
    logs)
        echo "📝 Просмотр логов (Ctrl+C для выхода):"
        pm2 logs
        ;;
    delete)
        echo "🗑️  Удаление всех процессов..."
        pm2 delete ecosystem.config.js
        echo "✅ Все процессы удалены!"
        ;;
    frontend)
        echo "🔧 Управление только фронтендом..."
        case ${2:-status} in
            start)
                pm2 start ecosystem.config.js --only frontend-dev
                ;;
            stop)
                pm2 stop frontend-dev
                ;;
            restart)
                pm2 restart frontend-dev
                ;;
            logs)
                pm2 logs frontend-dev
                ;;
        esac
        ;;
    backend)
        echo "🔧 Управление только бэкендом..."
        case ${2:-status} in
            start)
                pm2 start ecosystem.config.js --only backend-dev
                ;;
            stop)
                pm2 stop backend-dev
                ;;
            restart)
                pm2 restart backend-dev
                ;;
            logs)
                pm2 logs backend-dev
                ;;
        esac
        ;;
    *)
        echo "❓ Использование: $0 [start|stop|restart|status|logs|delete]"
        echo "🔧 Для отдельных сервисов:"
        echo "   $0 frontend [start|stop|restart|logs]"
        echo "   $0 backend [start|stop|restart|logs]"
        echo ""
        echo "📖 Примеры:"
        echo "   ./pm2-dev.sh start          # Запустить всё"
        echo "   ./pm2-dev.sh stop           # Остановить всё"
        echo "   ./pm2-dev.sh restart        # Перезапустить всё"
        echo "   ./pm2-dev.sh status         # Показать статус"
        echo "   ./pm2-dev.sh logs           # Просмотр логов"
        echo "   ./pm2-dev.sh frontend logs  # Логи только фронтенда"
        ;;
esac
