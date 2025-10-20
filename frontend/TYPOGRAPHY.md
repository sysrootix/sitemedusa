# Система типографики приложения

## Обзор шрифтов

В приложении используются три кастомных шрифта от Google Fonts:

### Inter
- **Назначение**: Основной шрифт для всего текста
- **Веса**: 300, 400, 500, 600, 700
- **Использование**: Основной контент, кнопки, формы, навигация

### Sora
- **Назначение**: Акцентный шрифт для заголовков и выделенного текста
- **Веса**: 300, 400, 500, 600, 700
- **Использование**: Подзаголовки, акцентный текст, специальные элементы

### Unbounded
- **Назначение**: Шрифт для основных заголовков и брендинга
- **Веса**: 300, 400, 500, 600, 700
- **Использование**: H1, H2, логотипы, важные заголовки

## Конфигурация Tailwind CSS

```javascript
fontFamily: {
  'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
  'sora': ['Sora', 'sans-serif'],
  'unbounded': ['Unbounded', 'cursive'],
  'display': ['Unbounded', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
  'heading': ['Unbounded', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
  'body': ['Inter', 'system-ui', 'sans-serif'],
}
```

## Использование в коде

### CSS классы

```html
<!-- Основной текст -->
<p class="font-body">Основной контент с шрифтом Inter</p>

<!-- Заголовки -->
<h1 class="font-heading">Главный заголовок с Unbounded/Sora</h1>
<h2 class="font-display">Дисплейный заголовок</h2>

<!-- Акцентный текст -->
<span class="font-accent">Выделенный текст с Sora</span>

<!-- Прямое использование -->
<h1 class="font-unbounded">Прямое использование Unbounded</h1>
<h2 class="font-sora">Прямое использование Sora</h2>
```

### Tailwind утилиты

```html
<!-- Использование через Tailwind -->
<h1 class="font-heading font-bold text-4xl">Заголовок</h1>
<p class="font-body text-lg leading-relaxed">Основной текст</p>
<span class="font-sora font-medium">Акцент</span>
```

### Существующие CSS классы

```html
<!-- Текстовая иерархия -->
<h1 class="text-display">Главный заголовок (Unbounded/Sora)</h1>
<h2 class="text-heading">Заголовок (Unbounded/Sora)</h2>
<h3 class="text-subheading">Подзаголовок (Unbounded/Sora)</h3>
<p class="text-body">Основной текст (Inter)</p>
<small class="text-caption">Подпись (Inter)</small>
```

## Рекомендации по использованию

### Заголовки
- **H1**: `font-heading` или `font-unbounded` с `font-bold`
- **H2-H4**: `font-heading` или `font-sora` с `font-semibold`
- **Акцентные заголовки**: `font-accent` с `font-medium`

### Основной контент
- **Параграфы**: `font-body` с `font-normal` или `font-light`
- **Списки**: `font-body` с `font-normal`
- **Кнопки**: `font-sans` с `font-medium`

### Специальные элементы
- **Логотипы**: `font-unbounded` с `font-bold`
- **Цитаты**: `font-sora` с `font-light` или `font-normal`
- **Кнопки CTA**: `font-sans` с `font-semibold`

## Вес шрифтов

### Inter (font-body)
- `font-light` (300): Для больших объемов текста
- `font-normal` (400): Стандартный вес
- `font-medium` (500): Для кнопок и ссылок
- `font-semibold` (600): Для важных элементов
- `font-bold` (700): Для заголовков

### Sora (font-accent)
- `font-light` (300): Для цитат и выделенного текста
- `font-normal` (400): Стандартный вес
- `font-medium` (500): Для подзаголовков
- `font-semibold` (600): Для акцентных заголовков
- `font-bold` (700): Для важных акцентов

### Unbounded (font-heading)
- `font-light` (300): Для больших заголовков
- `font-normal` (400): Для стандартных заголовков
- `font-medium` (500): Для подзаголовков
- `font-semibold` (600): Для важных заголовков
- `font-bold` (700): Для главного брендинга

## Примеры использования

```html
<!-- Пример страницы -->
<div class="max-w-4xl mx-auto p-8">
  <!-- Главный заголовок -->
  <h1 class="font-heading font-bold text-5xl mb-6">
    Добро пожаловать в <span class="font-unbounded">Medusa</span>
  </h1>

  <!-- Подзаголовок -->
  <h2 class="font-heading font-semibold text-3xl mb-4">
    Лучший вейп-шоп в Москве
  </h2>

  <!-- Основной контент -->
  <p class="font-body text-lg leading-relaxed mb-6">
    Откройте для себя мир премиального вейпинга с нашим ассортиментом
    качественных устройств и эксклюзивных жидкостей.
  </p>

  <!-- Акцентный текст -->
  <div class="font-accent font-medium text-xl mb-8">
    🎯 Более 10,000 довольных клиентов
  </div>

  <!-- Кнопки -->
  <div class="flex gap-4">
    <button class="font-sans font-medium px-6 py-3 bg-purple-600 text-white rounded-lg">
      Перейти в каталог
    </button>
    <button class="font-sans font-medium px-6 py-3 border border-purple-600 text-purple-600 rounded-lg">
      Узнать больше
    </button>
  </div>
</div>
```

## Оптимизация производительности

Шрифты загружаются асинхронно через Google Fonts с оптимизацией:
- Используются только необходимые веса (300, 400, 500, 600, 700)
- Включен `display=swap` для предотвращения FOIT (Flash of Invisible Text)
- Шрифты кэшируются браузером

## Темная тема

Все шрифты корректно работают с темной темой приложения. Для лучшей читаемости в темной теме рекомендуется использовать более насыщенные цвета текста.
