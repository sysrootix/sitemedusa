#!/bin/bash

# Скрипт для копирования иконок из src/assets/icons/social в public/assets/icons/social
# Используйте этот скрипт после добавления новых иконок

echo "🔄 Копирование иконок социальных сетей..."

# Создаем папку назначения, если она не существует
mkdir -p public/assets/icons/social

# Копируем все SVG файлы
cp src/assets/icons/social/*.svg public/assets/icons/social/

echo "✅ Иконки скопированы:"
ls -la public/assets/icons/social/

echo ""
echo "🔄 Перезапустите фронтенд для применения изменений:"
echo "npm run dev"

echo ""
echo "🌐 Иконки будут доступны по URL:"
echo "https://site.mda-platform.top/assets/icons/social/[icon].svg"
