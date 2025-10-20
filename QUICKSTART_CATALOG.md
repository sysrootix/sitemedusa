# 🚀 Быстрый Старт - Новый Каталог

## 📋 Предварительные Требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

---

## ⚡ Быстрый Запуск (5 минут)

### 1. Backend Setup

```bash
cd backend

# Установка зависимостей (если еще не установлены)
npm install

# Запуск миграции для создания таблицы корзины
npm run db:migrate:cart

# Запуск сервера в dev режиме
npm run dev
```

Backend будет доступен на `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Установка зависимостей (если еще не установлены)
npm install

# Запуск dev сервера
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

### 3. Проверка Работы

1. Откройте браузер: `http://localhost:5173/catalog`
2. Вы должны увидеть новый каталог с:
   - Поиском
   - Фильтрами
   - Рейтингами ⭐⭐⭐⭐⭐
   - Кнопками избранного ❤️
   - Кнопками корзины 🛒

---

## 🔧 Миграция Базы Данных

### Автоматическая Миграция

```bash
cd backend
npm run db:migrate:cart
```

### Ручная Миграция (SQL)

Если скрипт не работает, выполните SQL вручную:

```sql
-- Создание таблицы cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL,
  shop_code VARCHAR(255) NOT NULL,
  modification_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT unique_cart_item 
    UNIQUE(user_id, product_id, shop_code, modification_id)
);

-- Создание индексов
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 🧪 Тестирование Функционала

### 1. Проверка API Корзины

```bash
# Получить корзину (требуется авторизация)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/cart

# Добавить товар в корзину
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"...","shop_code":"...","price":100}' \
  http://localhost:5000/api/cart
```

### 2. Проверка Избранного

Избранное хранится в `localStorage`, откройте DevTools:

```javascript
// Проверить избранное
localStorage.getItem('medusa_favorites')

// Очистить избранное
localStorage.removeItem('medusa_favorites')
```

---

## 📱 Тестирование на Мобильных

### Chrome DevTools

1. Откройте DevTools (F12)
2. Нажмите иконку "Toggle device toolbar" (Ctrl+Shift+M)
3. Выберите устройство:
   - iPhone 12 Pro
   - iPhone SE
   - iPad Air
   - Samsung Galaxy S20

### Responsive Design Mode (Firefox)

1. Откройте DevTools (F12)
2. Нажмите иконку "Responsive Design Mode" (Ctrl+Shift+M)
3. Тестируйте разные размеры экрана

### Реальное Устройство

1. Найдите локальный IP:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Откройте на телефоне:
   ```
   http://YOUR_LOCAL_IP:5173/catalog
   ```

3. Убедитесь, что:
   - Backend тоже доступен на `YOUR_LOCAL_IP:5000`
   - Firewall разрешает соединения
   - Устройства в одной сети

---

## 🐛 Решение Проблем

### Backend не запускается

```bash
# Проверка подключения к БД
psql -h localhost -U your_user -d your_database

# Проверка портов
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows
```

### Frontend не запускается

```bash
# Очистка кэша
rm -rf node_modules
npm install

# Проверка портов
lsof -i :5173  # Linux/Mac
netstat -ano | findstr :5173  # Windows
```

### Миграция не работает

1. Проверьте права пользователя БД
2. Проверьте таблицу `users` существует
3. Выполните SQL вручную (см. выше)

### Корзина не работает

1. Проверьте авторизацию:
   ```javascript
   // В DevTools Console
   document.cookie
   ```

2. Проверьте API:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Проверьте таблицу:
   ```sql
   SELECT * FROM cart_items;
   ```

### Избранное не сохраняется

1. Проверьте localStorage:
   ```javascript
   console.log(localStorage.getItem('medusa_favorites'))
   ```

2. Проверьте настройки браузера (cookies enabled)
3. Попробуйте режим инкогнито

---

## 📊 Проверка Производительности

### Lighthouse Audit

1. Откройте DevTools (F12)
2. Перейдите на вкладку "Lighthouse"
3. Выберите:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Нажмите "Analyze page load"

**Ожидаемые Результаты:**
- Performance: 90+ (мобильный), 95+ (десктоп)
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

### Network Throttling

1. DevTools → Network
2. Выберите "Slow 3G" или "Fast 3G"
3. Обновите страницу
4. Проверьте:
   - Загрузка < 3 секунд
   - Контент видно сразу
   - Нет "layout shifts"

---

## 🔄 Версионирование

Проект использует три версии каталога:

### 1. CatalogHierarchicalV2 ✅ (Новая, Рекомендуемая)
- **Путь:** `/catalog`
- **Компонент:** `CatalogHierarchicalV2.tsx`
- **Фичи:** Все новые улучшения

### 2. CatalogHierarchical (V1)
- **Путь:** `/catalog-v1`
- **Компонент:** `CatalogHierarchical.tsx`
- **Статус:** Legacy

### 3. Catalog (Original)
- **Путь:** `/catalog-old`
- **Компонент:** `Catalog.tsx`
- **Статус:** Deprecated

---

## 📚 Дополнительные Ресурсы

- [Полная Документация](./CATALOG_UX_UI_IMPROVEMENTS.md)
- [API Endpoints](./CATALOG_UX_UI_IMPROVEMENTS.md#-api-endpoints)
- [Архитектура](./CATALOG_UX_UI_IMPROVEMENTS.md#-архитектура)
- [Troubleshooting](./CATALOG_UX_UI_IMPROVEMENTS.md#-решение-проблем)

---

## 🎉 Готово!

Теперь у вас работает современный каталог с **10/10 UX/UI**!

### Что Дальше?

1. ✅ Добавьте реальные изображения товаров
2. ✅ Настройте аналитику (Google Analytics, Yandex Metrica)
3. ✅ Добавьте больше товаров
4. ✅ Настройте SEO метаданные
5. ✅ Протестируйте на реальных пользователях

---

## 💬 Поддержка

Если что-то не работает:

1. Проверьте логи:
   ```bash
   # Backend logs
   cd backend && npm run dev
   
   # Frontend logs
   cd frontend && npm run dev
   ```

2. Проверьте консоль браузера (F12)
3. Проверьте Network tab для API запросов
4. Откройте issue в репозитории

---

**Удачи! 🚀**

