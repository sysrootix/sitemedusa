#!/usr/bin/env ts-node

import { config } from '@/config';
import { Sequelize } from 'sequelize';

async function runArticlesMigrationStepByStep() {
  console.log('🚀 Starting articles migration (step by step)...');

  // Create Sequelize instance with database config
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    logging: console.log,
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Execute migration in steps to avoid syntax issues
    console.log('📝 Executing migration in steps...');

    // Step 1: Create tables without foreign keys first
    console.log('📋 Step 1: Creating base tables...');
    const baseTablesSQL = `
      -- Create article_categories table
      CREATE TABLE IF NOT EXISTS article_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7),
          icon VARCHAR(50),
          parent_id UUID,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create article_tags table
      CREATE TABLE IF NOT EXISTS article_tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(50) NOT NULL UNIQUE,
          slug VARCHAR(50) NOT NULL UNIQUE,
          color VARCHAR(7),
          description VARCHAR(255),
          usage_count INTEGER DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create articles table
      CREATE TABLE IF NOT EXISTS articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(200) NOT NULL,
          slug VARCHAR(200) NOT NULL UNIQUE,
          excerpt TEXT,
          content TEXT NOT NULL,
          featured_image VARCHAR(500),
          author_id UUID NOT NULL,
          category_id UUID,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          published_at TIMESTAMP WITH TIME ZONE,
          scheduled_at TIMESTAMP WITH TIME ZONE,
          is_featured BOOLEAN NOT NULL DEFAULT FALSE,
          is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
          allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
          view_count INTEGER DEFAULT 0,
          like_count INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          share_count INTEGER DEFAULT 0,
          reading_time INTEGER,
          seo_title VARCHAR(60),
          seo_description VARCHAR(160),
          seo_keywords VARCHAR(255),
          meta_tags JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP WITH TIME ZONE
      );
    `;
    await sequelize.query(baseTablesSQL);

    // Step 2: Add foreign key constraints
    console.log('🔗 Step 2: Adding foreign key constraints...');
    const foreignKeysSQL = `
      -- Add foreign keys to articles
      ALTER TABLE articles ADD CONSTRAINT fk_articles_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

      -- Add parent reference to article_categories
      ALTER TABLE article_categories ADD CONSTRAINT fk_article_categories_parent_id
        FOREIGN KEY (parent_id) REFERENCES article_categories(id) ON DELETE SET NULL;

      -- Add category reference to articles
      ALTER TABLE articles ADD CONSTRAINT fk_articles_category_id
        FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL;
    `;
    await sequelize.query(foreignKeysSQL);

    // Step 3: Create remaining tables
    console.log('📋 Step 3: Creating remaining tables...');
    const remainingTablesSQL = `
      -- Create article_tag_relations table
      CREATE TABLE IF NOT EXISTS article_tag_relations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          tag_id UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_article_tag_relations_unique ON article_tag_relations(article_id, tag_id);

      -- Create article_comments table
      CREATE TABLE IF NOT EXISTS article_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          parent_id UUID,
          content TEXT NOT NULL,
          is_approved BOOLEAN NOT NULL DEFAULT TRUE,
          is_spam BOOLEAN NOT NULL DEFAULT FALSE,
          like_count INTEGER DEFAULT 0,
          reply_count INTEGER DEFAULT 0,
          depth INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP WITH TIME ZONE
      );

      -- Create article_likes table
      CREATE TABLE IF NOT EXISTS article_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_article_likes_unique ON article_likes(article_id, user_id);

      -- Create article_views table
      CREATE TABLE IF NOT EXISTS article_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          referrer TEXT,
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          session_id VARCHAR(255)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_article_views_unique ON article_views(article_id, user_id, session_id, DATE(viewed_at));

      -- Create article_attachments table
      CREATE TABLE IF NOT EXISTS article_attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          alt_text VARCHAR(255),
          caption TEXT,
          sort_order INTEGER DEFAULT 0,
          is_featured BOOLEAN NOT NULL DEFAULT FALSE,
          uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create article_drafts table
      CREATE TABLE IF NOT EXISTS article_drafts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200),
          content TEXT,
          excerpt TEXT,
          category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
          featured_image VARCHAR(500),
          seo_title VARCHAR(60),
          seo_description VARCHAR(160),
          seo_keywords VARCHAR(255),
          meta_tags JSONB,
          auto_saved BOOLEAN NOT NULL DEFAULT FALSE,
          last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE
      );

      -- Create article_revisions table
      CREATE TABLE IF NOT EXISTS article_revisions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200),
          content TEXT,
          excerpt TEXT,
          category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
          featured_image VARCHAR(500),
          seo_title VARCHAR(60),
          seo_description VARCHAR(160),
          seo_keywords VARCHAR(255),
          meta_tags JSONB,
          revision_number INTEGER NOT NULL,
          change_summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sequelize.query(remainingTablesSQL);

    // Step 4: Add self-referencing foreign key for comments
    console.log('🔗 Step 4: Adding self-referencing foreign key for comments...');
    const selfRefSQL = `
      ALTER TABLE article_comments ADD CONSTRAINT fk_article_comments_parent_id
        FOREIGN KEY (parent_id) REFERENCES article_comments(id) ON DELETE CASCADE;
    `;
    await sequelize.query(selfRefSQL);

    // Step 5: Create indexes
    console.log('⚡ Step 5: Creating indexes...');
    const indexesSQL = `
      -- Indexes for article_categories
      CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);
      CREATE INDEX IF NOT EXISTS idx_article_categories_sort_order ON article_categories(sort_order);
      CREATE INDEX IF NOT EXISTS idx_article_categories_is_active ON article_categories(is_active);

      -- Indexes for articles
      CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
      CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
      CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);

      -- Indexes for article_tags
      CREATE INDEX IF NOT EXISTS idx_article_tags_slug ON article_tags(slug);
      CREATE INDEX IF NOT EXISTS idx_article_tags_usage_count ON article_tags(usage_count);

      -- Indexes for article_comments
      CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_comments_author_id ON article_comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at);

      -- Indexes for article_likes
      CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);

      -- Indexes for article_views
      CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);

      -- Indexes for article_attachments
      CREATE INDEX IF NOT EXISTS idx_article_attachments_article_id ON article_attachments(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_attachments_uploaded_by ON article_attachments(uploaded_by);

      -- Indexes for article_drafts
      CREATE INDEX IF NOT EXISTS idx_article_drafts_author_id ON article_drafts(author_id);
      CREATE INDEX IF NOT EXISTS idx_article_drafts_last_modified ON article_drafts(last_modified);

      -- Indexes for article_revisions
      CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_revisions_revision_number ON article_revisions(revision_number);
    `;
    await sequelize.query(indexesSQL);

    // Step 6: Insert default data
    console.log('📝 Step 6: Inserting default data...');
    const defaultDataSQL = `
      -- Insert default categories
      INSERT INTO article_categories (name, slug, description, color, icon, sort_order) VALUES
      ('Новости', 'news', 'Новости компании и индустрии', '#FF6B6B', 'newspaper', 1),
      ('Руководства', 'guides', 'Подробные руководства и инструкции', '#4ECDC4', 'book', 2),
      ('Обзоры', 'reviews', 'Обзоры продуктов и сервисов', '#45B7D1', 'star', 3),
      ('Советы', 'tips', 'Полезные советы и рекомендации', '#FFA07A', 'lightbulb', 4),
      ('Техническая поддержка', 'support', 'Техническая поддержка и FAQ', '#98D8C8', 'question-circle', 5)
      ON CONFLICT (slug) DO NOTHING;

      -- Insert default tags
      INSERT INTO article_tags (name, slug, description, color) VALUES
      ('Важное', 'important', 'Важные объявления', '#FF0000'),
      ('Обновление', 'update', 'Информация об обновлениях', '#FFA500'),
      ('Новинка', 'new', 'Новые продукты и функции', '#32CD32'),
      ('Акция', 'promotion', 'Акции и скидки', '#FF69B4'),
      ('Техническое', 'technical', 'Технические статьи', '#708090')
      ON CONFLICT (slug) DO NOTHING;
    `;
    await sequelize.query(defaultDataSQL);

    console.log('✅ Migration completed successfully in steps!');
    console.log('📊 Created tables:');
    console.log('  - article_categories');
    console.log('  - articles');
    console.log('  - article_tags');
    console.log('  - article_tag_relations');
    console.log('  - article_comments');
    console.log('  - article_likes');
    console.log('  - article_views');
    console.log('  - article_attachments');
    console.log('  - article_drafts');
    console.log('  - article_revisions');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
runArticlesMigrationStepByStep().catch(console.error);
