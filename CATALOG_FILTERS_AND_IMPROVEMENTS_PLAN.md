# 🎯 План внедрения фильтров и улучшений каталога

## Дата: 2 октября 2025

## Задачи

### 1. ✅ Фильтры (компонент создан)
- **Файл:** `frontend/src/components/CatalogFilters.tsx` - СОЗДАН
- Фильтр по цене (мин/макс)
- Фильтр "Только в наличии"
- Сортировка (по цене ↑↓, по названию А-Я/Я-А)

### 2. ⏳ Интеграция фильтров в каталог
- Добавить компонент CatalogFilters в CatalogHierarchical
- Применять фильтры к продуктам через useMemo
- Сбрасывать фильтры при смене категории

### 3. ⏳ Кнопка "Показать все товары"
- Показывать в категориях с подкатегориями
- При клике загружать все товары из категории и подкатегорий

### 4. ⏳ Логика выбора модификаций
- В режиме "Магазин" + есть модификации → показать выбор перед добавлением в корзину
- Не открывать модальное окно, а показать выбор модификаций прямо в карточке

---

## Код для внедрения

### Шаг 1: Добавить useMemo для фильтрации и сортировки

Добавить после всех useState в `CatalogHierarchical.tsx`:

```tsx
// Apply filters and sorting to products
const filteredAndSortedProducts = useMemo(() => {
  if (products.length === 0) return [];

  let filtered = [...products];

  // Filter by price
  if (filters.minPrice !== null) {
    filtered = filtered.filter(p => {
      const price = catalogMode === 'general' ? p.min_price : p.retail_price;
      return price && price >= filters.minPrice!;
    });
  }

  if (filters.maxPrice !== null) {
    filtered = filtered.filter(p => {
      const price = catalogMode === 'general' ? p.max_price : p.retail_price;
      return price && price <= filters.maxPrice!;
    });
  }

  // Filter by stock
  if (filters.inStockOnly) {
    filtered = filtered.filter(p => {
      if (catalogMode === 'general') {
        return p.total_quantity && p.total_quantity > 0;
      } else {
        return p.quanty && p.quanty > 0;
      }
    });
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          const priceA = catalogMode === 'general' ? a.min_price : a.retail_price;
          const priceB = catalogMode === 'general' ? b.min_price : b.retail_price;
          return (priceA || 0) - (priceB || 0);
        
        case 'price-desc':
          const priceA2 = catalogMode === 'general' ? a.max_price : a.retail_price;
          const priceB2 = catalogMode === 'general' ? b.max_price : b.retail_price;
          return (priceB2 || 0) - (priceA2 || 0);
        
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ru');
        
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ru');
        
        default:
          return 0;
      }
    });
  }

  return filtered;
}, [products, filters, catalogMode]);
```

### Шаг 2: Добавить компонент фильтров в рендер

В `CatalogHierarchical.tsx`, после breadcrumbs, перед показом товаров:

```tsx
{/* Filters - show only when viewing products */}
{products.length > 0 && (
  <CatalogFilters
    filters={filters}
    onFiltersChange={setFilters}
    productCount={filteredAndSortedProducts.length}
  />
)}
```

### Шаг 3: Заменить `products` на `filteredAndSortedProducts`

В map'е товаров заменить:

```tsx
// БЫЛО:
{products.map((product, index) => ( ... ))}

// СТАЛО:
{filteredAndSortedProducts.map((product, index) => ( ... ))}
```

### Шаг 4: Добавить кнопку "Показать все товары"

После показа категорий, добавить кнопку:

```tsx
{/* Show "All Products" button if category has subcategories */}
{categories.length > 0 && currentCategoryId && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6"
  >
    <button
      onClick={() => {
        setShowAllProducts(true);
        loadCategoryDetails(currentCategoryId);
      }}
      className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
    >
      <Package className="w-5 h-5" />
      Показать все товары категории
    </button>
  </motion.div>
)}
```

### Шаг 5: Логика выбора модификаций (для режима магазина)

Добавить новое состояние:

```tsx
const [selectedModifications, setSelectedModifications] = useState<{[productId: string]: string}>({});
```

Изменить рендер кнопки "В корзину" для товаров с модификациями:

```tsx
{/* В карточке товара */}
{catalogMode === 'shop' && product.modifications && product.modifications.length > 0 ? (
  <div>
    {/* Dropdown с выбором модификации */}
    <select
      value={selectedModifications[product.id] || ''}
      onChange={(e) => setSelectedModifications({
        ...selectedModifications,
        [product.id]: e.target.value
      })}
      className="w-full px-4 py-2 mb-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Выберите вариант</option>
      {product.modifications.map((mod: any) => (
        <option key={mod.id} value={mod.id}>
          {mod.name} - {Math.round(mod.retail_price).toLocaleString('ru-RU')} ₽
        </option>
      ))}
    </select>
    
    <button
      onClick={() => {
        if (!selectedModifications[product.id]) {
          toast.error('Пожалуйста, выберите вариант товара');
          return;
        }
        toast.success('Товар добавлен в корзину');
      }}
      disabled={!selectedModifications[product.id]}
      className={`w-full px-4 py-2 rounded-xl text-sm font-semibold ${
        selectedModifications[product.id]
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
      }`}
    >
      В корзину
    </button>
  </div>
) : (
  // Обычная кнопка для товаров без модификаций
  <button
    onClick={() => {
      if (catalogMode === 'general') {
        handleProductClick(product.id);
      } else {
        toast.success('Товар добавлен в корзину');
      }
    }}
    className="w-full px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
  >
    {catalogMode === 'general' ? 'Посмотреть' : 'В корзину'}
  </button>
)}
```

---

## Итоговый результат

### Фильтры:
```
┌──────────────────────────────────────────────────┐
│ [🎛️ Фильтры и сортировка ▼]  (активных: 2)     │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Фильтры              [Сбросить все]         │ │
│ │                                              │ │
│ │  Цена, ₽      │  Наличие         │ Сортировка│ │
│ │  [От][—][До]  │  [✓] Только в    │ [Цена: ↑] │ │
│ │               │      наличии     │           │ │
│ │                                              │ │
│ │  Найдено товаров: 24                        │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Кнопка "Все товары":
```
POD-системы
│
├─ до 15 W (45 товаров)
├─ до 30 W (120 товаров)
└─ свыше 30 W (80 товаров)

[📦 Показать все товары категории]  ← НОВАЯ КНОПКА
```

### Выбор модификации:
```
┌────────────────────────────────────┐
│ Устройство Brusko Feelin          │
│ 2 790 ₽                           │
│ В наличии: 3 шт.                  │
│                                   │
│ [Выберите вариант        ▼]       │  ← НОВЫЙ DROPDOWN
│   ├─ Тёмно-Зеленый - 2 790 ₽    │
│   ├─ Красный - 2 790 ₽          │
│   └─ Синий - 2 790 ₽            │
│                                   │
│ [В корзину]                       │
└────────────────────────────────────┘
```

---

## Как внедрить

### Вариант 1: Полное внедрение (рекомендуется)
1. Скопируйте код из этого файла
2. Примените изменения последовательно
3. Протестируйте каждую функцию

### Вариант 2: Постепенное внедрение
1. Сначала фильтры (Шаги 1-3)
2. Потом кнопка "Все товары" (Шаг 4)
3. Наконец модификации (Шаг 5)

---

## Дополнительные улучшения (опционально)

1. **Сохранение фильтров в URL** - чтобы можно было делиться ссылкой
2. **Быстрые фильтры** - кнопки "До 1000₽", "От 1000 до 3000₽" и т.д.
3. **Фильтр по брендам** - если есть информация о производителях
4. **История просмотров** - показывать недавно просмотренные товары

---

## Технические детали

- Фильтры применяются на клиенте через `useMemo`
- Не требуют дополнительных API запросов
- Мгновенная фильтрация без перезагрузки
- Автоматический подсчет результатов

Все готово к внедрению! 🚀

