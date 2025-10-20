# Система статей (Articles System)

Полноценная система управления статьями для проекта Osnova с поддержкой категорий, тегов, комментариев, лайков, просмотров и многого другого.

## 🚀 Быстрый старт

### 1. Настройка базы данных

Создайте `.env` файл в корне папки `backend` со следующими переменными:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=osnova_db
DB_USER=osnova_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_USERNAME=@your_bot_username

# Other required variables...
FRONTEND_URL=http://localhost:5173
```

### 2. Запуск миграции

```bash
# Из папки backend
./run_articles_migration.sh
```

Или вручную:

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/run_articles_migration.ts
```

### 3. Проверка установки

После успешной миграции в вашей базе данных появятся следующие таблицы:

- `article_categories` - Категории статей
- `articles` - Основная таблица статей
- `article_tags` - Теги статей
- `article_tag_relations` - Связь статей с тегами (many-to-many)
- `article_comments` - Комментарии к статьям
- `article_likes` - Лайки статей
- `article_views` - Просмотры статей
- `article_attachments` - Вложения к статьям
- `article_drafts` - Черновики статей
- `article_revisions` - История изменений статей

## 📋 Функциональность

### Основные возможности

#### Статьи (Articles)
- **Статусы**: Черновик, Опубликовано, Архив, Запланировано
- **SEO оптимизация**: Заголовок, описание, ключевые слова
- **Мета-данные**: JSON поле для дополнительных данных
- **Статистика**: Просмотры, лайки, комментарии, репосты
- **Время чтения**: Автоматический расчет
- **Закрепление**: Возможность закрепить статью

#### Категории (Categories)
- **Иерархическая структура**: Поддержка вложенных категорий
- **Сортировка**: Порядок отображения
- **Цветовая схема**: Цвета для визуального отличия
- **Иконки**: Поддержка иконок для категорий

#### Теги (Tags)
- **Много-к-многим**: Одна статья может иметь много тегов
- **Статистика использования**: Счетчик использования тегов
- **Цветовое оформление**: Цвета для тегов

#### Комментарии (Comments)
- **Потоковые комментарии**: Поддержка вложенных ответов (до 5 уровней)
- **Модерация**: Одобрение комментариев
- **Лайки**: Возможность лайкать комментарии
- **Спам-фильтр**: Пометка комментариев как спам

#### Просмотры (Views)
- **Отслеживание**: Уникальные просмотры с сессиями
- **Анонимные просмотры**: Поддержка просмотров без авторизации
- **Аналитика**: Источники трафика, география, устройства

#### Вложения (Attachments)
- **Многоформатность**: Изображения, документы, видео, аудио
- **Метаданные**: Альтернативный текст, подписи
- **Сортировка**: Порядок отображения вложений

#### Черновики (Drafts)
- **Автосохранение**: Автоматическое сохранение черновиков
- **Истечение срока**: Автоматическое удаление старых черновиков
- **Мета-данные**: Все поля статьи доступны в черновиках

#### Ревизии (Revisions)
- **История изменений**: Полная история редактирования
- **Сравнение версий**: Возможность сравнивать версии
- **Авторство**: Кто и когда внес изменения

## 🏗️ Архитектура

### Модели Sequelize

#### Основные модели:
- `Article` - Основная модель статьи
- `ArticleCategory` - Модель категории
- `ArticleTag` - Модель тега
- `ArticleComment` - Модель комментария
- `ArticleLike` - Модель лайка
- `ArticleView` - Модель просмотра
- `ArticleAttachment` - Модель вложения
- `ArticleDraft` - Модель черновика
- `ArticleRevision` - Модель ревизии
- `ArticleTagRelation` - Модель связи статья-тег

### Связи между моделями

```
User
├── articles (1:N)
├── articleComments (1:N)
├── articleLikes (1:N)
├── articleViews (1:N)
├── articleDrafts (1:N)
├── articleRevisions (1:N)
└── uploadedAttachments (1:N)

Article
├── author (N:1) -> User
├── category (N:1) -> ArticleCategory
├── tags (N:M) -> ArticleTag
├── comments (1:N) -> ArticleComment
├── likes (1:N) -> ArticleLike
├── views (1:N) -> ArticleView
├── attachments (1:N) -> ArticleAttachment
├── drafts (1:N) -> ArticleDraft
└── revisions (1:N) -> ArticleRevision

ArticleCategory
├── parent (N:1) -> ArticleCategory
├── children (1:N) -> ArticleCategory
├── articles (1:N) -> Article
├── drafts (1:N) -> ArticleDraft
└── revisions (1:N) -> ArticleRevision

ArticleComment
├── article (N:1) -> Article
├── author (N:1) -> User
├── parent (N:1) -> ArticleComment
└── replies (1:N) -> ArticleComment
```

## 🎯 Использование

### Создание статьи

```typescript
import { Article, ArticleCreateData } from '@/models';

const articleData: ArticleCreateData = {
  title: 'Моя первая статья',
  content: '<p>Содержание статьи...</p>',
  excerpt: 'Краткое описание статьи',
  category_id: 'category-uuid',
  status: ArticleStatus.PUBLISHED,
  tag_ids: ['tag1-uuid', 'tag2-uuid']
};

const article = await Article.create(articleData);
```

### Получение опубликованных статей

```typescript
// Получить все опубликованные статьи
const publishedArticles = await Article.findPublished({
  include: [
    { model: User, as: 'author' },
    { model: ArticleCategory, as: 'category' },
    { model: ArticleTag, as: 'tags' }
  ]
});

// Получить статьи по категории
const categoryArticles = await Article.findByCategory('category-uuid');

// Поиск статей
const searchResults = await Article.search('ключевое слово');
```

### Работа с комментариями

```typescript
// Создание комментария
const comment = await ArticleComment.create({
  article_id: 'article-uuid',
  author_id: 'user-uuid',
  content: 'Отличная статья!'
});

// Получение комментариев со вложенными ответами
const comments = await ArticleComment.findAll({
  where: { article_id: 'article-uuid', parent_id: null },
  include: [
    { model: User, as: 'author' },
    {
      model: ArticleComment,
      as: 'replies',
      include: [{ model: User, as: 'author' }]
    }
  ]
});
```

## 🔧 API Endpoints (предлагаемые)

### Статьи
- `GET /api/articles` - Получить список статей
- `GET /api/articles/:slug` - Получить статью по slug
- `POST /api/articles` - Создать статью
- `PUT /api/articles/:id` - Обновить статью
- `DELETE /api/articles/:id` - Удалить статью

### Категории
- `GET /api/categories` - Получить категории
- `POST /api/categories` - Создать категорию
- `PUT /api/categories/:id` - Обновить категорию

### Комментарии
- `GET /api/articles/:id/comments` - Получить комментарии статьи
- `POST /api/articles/:id/comments` - Создать комментарий
- `PUT /api/comments/:id` - Обновить комментарий
- `DELETE /api/comments/:id` - Удалить комментарий

### Лайки
- `POST /api/articles/:id/like` - Поставить лайк
- `DELETE /api/articles/:id/like` - Убрать лайк

## 📊 Статистика и аналитика

### Основные метрики
- Общее количество статей
- Количество просмотров
- Количество лайков и комментариев
- Популярные категории и теги
- Активность пользователей

### Аналитика просмотров
- Просмотры по времени
- Источники трафика
- География просмотров
- Типы устройств

## 🔒 Безопасность

### Валидация данных
- Все входные данные валидируются
- SQL инъекции предотвращены через Sequelize
- XSS защита через санитизацию контента

### Авторизация и права доступа
- Проверка прав на создание/редактирование статей
- Модерация комментариев
- Защита от спама

### Производительность
- Индексы на часто используемые поля
- Кеширование популярных статей
- Оптимизация запросов

## 🚀 Следующие шаги

1. **Создать API контроллеры** для статей
2. **Добавить роуты** в Express приложение
3. **Создать фронтенд компоненты** для отображения статей
4. **Добавить систему уведомлений** о новых комментариях
5. **Реализовать поиск и фильтры**
6. **Добавить систему рейтинга** статей

## 📝 Заметки

- Все таблицы используют UUID в качестве первичных ключей
- Поддерживается мягкое удаление (soft delete) для основных сущностей
- Автоматические счетчики обновляются через триггеры базы данных
- Система готова к масштабированию и высокой нагрузке

---

**Система готова к использованию!** 🎉
