# Иконки социальных сетей

## Структура папки

```
social/
├── telegram.svg       # ✅ Иконка Telegram (уже добавлена)
├── vk.svg            # 🔄 Иконка VK (нужно добавить)
├── instagram.svg     # 🔄 Иконка Instagram (нужно добавить)
├── tiktok.svg        # 🔄 Иконка TikTok (нужно добавить)
├── youtube.svg       # 🔄 Иконка YouTube (нужно добавить)
├── README.md         # ✅ Этот файл
├── index.js          # ✅ Экспорт всех иконок
├── example-usage.tsx # ✅ Пример использования
└── .gitkeep         # ✅ Для контроля версий
```

## Формат иконок

### Требования:
- **Формат**: SVG (предпочтительно) или PNG
- **Размер**: 24x24px или 32x32px (для retina экранов)
- **Цвет**: Монохромный (черный или белый) для возможности окрашивания через CSS
- **Фон**: Прозрачный

### Рекомендации:
- Используйте простой геометрический стиль
- Избегайте сложных градиентов
- Убедитесь, что иконки читаемы при маленьком размере
- Протестируйте на разных фонах (светлый/темный)

## Использование в коде

### ✅ Текущий способ (уже настроен):

```javascript
import { telegram, vk, instagram, tiktok, youtube } from '@/assets/icons/social'

// В компоненте
<img src={telegram} alt="Telegram" className="w-6 h-6" />
```

### 🔄 Альтернативный способ (после добавления файлов):

```javascript
// Раскомментируйте в index.js:
// export { default as telegram } from './telegram.svg'

import telegramIcon from './telegram.svg'

// В JSX
<img src={telegramIcon} alt="Telegram" />
```

## ✅ Замена существующих иконок (УЖЕ ВЫПОЛНЕНА)

Все компоненты уже обновлены для использования кастомных иконок:

### Обновленные компоненты:
- ✅ `Footer.tsx` - социальные сети в футере
- ✅ `Contact.tsx` - кнопки быстрой связи
- ✅ `AuthModal.tsx` - иконки в модальном окне авторизации
- ✅ `TelegramAuth.tsx` - иконки в компоненте авторизации

### Изменения в импортах:
```javascript
// Было:
import { MessageCircle, Users, Instagram, Music, Youtube } from 'lucide-react'

// Стало:
import { telegram, vk, instagram, tiktok, youtube } from '@/assets/icons/social'
```

## Примеры иконок для скачивания

Если нужно, вот ссылки на официальные иконки:

### Telegram
- Официальная: https://telegram.org/img/website_icon.svg
- Альтернатива: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/telegram.svg

### VK
- Официальная: https://vk.com/images/icons/favicons/fav_logo.ico (может потребоваться конвертация)
- Альтернатива: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/vk.svg

### Instagram
- Официальная: https://www.instagram.com/static/images/ico/favicon-192.png (конвертировать в SVG)
- Альтернатива: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/instagram.svg

### TikTok
- Официальная: https://sf16-scmcdn-sg.ibytedtos.com/goofy/tiktok/web/node/_next/static/images/favicon-2288e461a6c1c38a.png
- Альтернатива: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/tiktok.svg

### YouTube
- Официальная: https://www.youtube.com/s/desktop/1c1b5e7a/img/favicon_32x32.png
- Альтернатива: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/youtube.svg

## Оптимизация

### Для SVG:
- Минифицируйте код SVG
- Удалите ненужные атрибуты
- Используйте viewBox для масштабирования

### Для PNG:
- Используйте формат PNG-8 для простых иконок
- Оптимизируйте размер файла
- Создайте версии @2x для retina экранов

---

## 🎯 ТЕКУЩЕЕ СОСТОЯНИЕ СИСТЕМЫ

### ✅ Что уже настроено:
- 📁 Структура папок создана
- 🔧 Экспорт иконок настроен (`index.js`)
- 📝 Документация подготовлена (`README.md`)
- 💻 Пример использования готов (`example-usage.tsx`)
- 🔄 Все компоненты обновлены для использования кастомных иконок
- 🌐 Статические файлы настроены в `public/assets/icons/social/`

### 🔄 Что нужно сделать:
- 📥 Добавить файлы иконок в папку `public/assets/icons/social/`:
  - `vk.svg`
  - `instagram.svg`
  - `tiktok.svg`
  - `youtube.svg`
- ✅ `telegram.svg` уже добавлен
- ✅ Статические файлы настроены и доступны по URL

### 🚀 Как использовать:
```javascript
import { telegram, vk, instagram, tiktok, youtube } from '@/assets/icons/social'

// В любом компоненте
<img src={telegram} alt="Telegram" className="w-5 h-5" />
```

### 🌐 Настройка статических файлов:
- Иконки находятся в: `public/assets/icons/social/`
- Доступны по URL: `https://site.mda-platform.top/assets/icons/social/[icon].svg`
- Nginx автоматически обслуживает файлы из папки `public/`

**Система полностью готова к использованию!** 🎉
