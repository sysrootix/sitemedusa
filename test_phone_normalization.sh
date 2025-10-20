#!/bin/bash

# Тест нормализации телефонов для API авторизации
# Этот скрипт тестирует различные форматы телефонных номеров

API_URL="https://site.mda-platform.top/api/auth/phone/send-code"

echo "🧪 Тестирование нормализации телефонных номеров..."
echo "================================================"

# Массив тестовых телефонов в разных форматах
declare -a test_phones=(
    "+7 (924) 407-37-47"
    "79244073747"
    "89244073747"
    "+79244073747"
    "9244073747"
    "+7 924 407 37 47"
    "8 (924) 407-37-47"
)

# Ожидаемый нормализованный результат
expected_normalized="79244073747"

echo "Ожидаемый нормализованный номер в БД: $expected_normalized"
echo ""

for phone in "${test_phones[@]}"; do
    echo "📱 Тестируем: '$phone'"
    
    # Отправляем POST запрос
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"phone\": \"$phone\"}" \
        "$API_URL")
    
    # Проверяем статус ответа
    if echo "$response" | grep -q '"success".*true'; then
        echo "✅ Успех: $phone -> нормализован правильно"
    elif echo "$response" | grep -q '"success".*false'; then
        error_message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "❌ Ошибка: $phone -> $error_message"
    else
        echo "⚠️  Неожиданный ответ: $response"
    fi
    
    echo ""
    sleep 1  # Небольшая пауза между запросами
done

echo "================================================"
echo "Тестирование завершено!"
echo ""
echo "Примечания:"
echo "- Все номера должны нормализоваться в формат: $expected_normalized"
echo "- Если пользователь не найден, проверьте наличие записи в таблице users"
echo "- Убедитесь, что в колонке normalized_phone есть значение: $expected_normalized"
