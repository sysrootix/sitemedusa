#!/bin/bash

# Скрипт для копирования sitemap файлов со старого сайта

set -e

echo "📄 Копирование sitemap файлов со старого сайта"
echo "=============================================="

OLD_DOMAIN="mda-medusa.ru"
NEW_DOMAIN="site.mda-platform.top"
OUTPUT_DIR="frontend/public"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Проверка наличия curl
if ! command -v curl &> /dev/null; then
    print_error "curl не установлен"
    exit 1
fi

# Список sitemap файлов для копирования
SITEMAPS=(
    "sitemap-iblock-11.xml"
    "sitemap-iblock-31.xml"
    "sitemap-iblock-39.xml"
    "sitemap-iblock-40.xml"
)

echo ""
print_warning "Скачивание sitemap файлов..."

for sitemap in "${SITEMAPS[@]}"; do
    echo ""
    echo "Обработка: $sitemap"

    # Скачать файл
    TEMP_FILE="/tmp/$sitemap"
    OLD_URL="https://$OLD_DOMAIN/$sitemap"
    OUTPUT_FILE="$OUTPUT_DIR/$sitemap"

    print_warning "Скачивание $OLD_URL..."

    if curl -s -f "$OLD_URL" -o "$TEMP_FILE"; then
        print_success "Файл скачан"

        # Замена домена
        print_warning "Замена домена: $OLD_DOMAIN → $NEW_DOMAIN"
        sed "s|https://$OLD_DOMAIN|https://$NEW_DOMAIN|g" "$TEMP_FILE" > "$OUTPUT_FILE"

        # Также замена http на https (на всякий случай)
        sed -i.bak "s|http://$OLD_DOMAIN|https://$NEW_DOMAIN|g" "$OUTPUT_FILE"
        rm -f "$OUTPUT_FILE.bak"

        print_success "Сохранено в: $OUTPUT_FILE"

        # Показать количество URL
        URL_COUNT=$(grep -c "<loc>" "$OUTPUT_FILE" || echo "0")
        echo "  URL в файле: $URL_COUNT"
    else
        print_error "Не удалось скачать $OLD_URL"
        print_warning "Возможно файл не существует на старом сайте"
    fi
done

echo ""
print_success "=============================================="
print_success "Готово! Sitemap файлы скопированы"
echo ""
echo "📁 Файлы сохранены в: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"/*.xml | grep sitemap-iblock || true

echo ""
print_warning "Проверьте файлы перед деплоем:"
echo "  cat frontend/public/sitemap-iblock-11.xml"

echo ""
print_warning "После деплоя файлы будут доступны по URL:"
for sitemap in "${SITEMAPS[@]}"; do
    echo "  https://$NEW_DOMAIN/$sitemap"
done
