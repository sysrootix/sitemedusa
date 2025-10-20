#!/usr/bin/env ts-node

import { config } from '@/config';
import { Sequelize } from 'sequelize';

async function createRemainingTables() {
  console.log('🚀 Creating remaining article tables...');

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

    // Create remaining tables one by one
    console.log('📋 Creating remaining tables...');

    // Create article_tag_relations table
    console.log('Creating article_tag_relations...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS article_tag_relations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          tag_id UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_article_tag_relations_unique ON article_tag_relations(article_id, tag_id)`);

    // Create article_comments table
    console.log('Creating article_comments...');
    await sequelize.query(`
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
      )
    `);

    // Add self-referencing foreign key for comments
    await sequelize.query(`
      ALTER TABLE article_comments ADD CONSTRAINT fk_article_comments_parent_id
        FOREIGN KEY (parent_id) REFERENCES article_comments(id) ON DELETE CASCADE
    `).catch(err => {
      if (!err.message.includes('already exists')) throw err;
      console.log('Comment parent constraint already exists, skipping...');
    });

    // Create article_likes table
    console.log('Creating article_likes...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS article_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_article_likes_unique ON article_likes(article_id, user_id)`);

    // Create article_views table
    console.log('Creating article_views...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS article_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          referrer TEXT,
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          session_id VARCHAR(255)
      )
    `);
    // Note: Unique constraint on views is complex due to DATE function
    // We'll handle uniqueness in application logic instead

    // Create article_attachments table
    console.log('Creating article_attachments...');
    await sequelize.query(`
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
      )
    `);

    // Create article_drafts table
    console.log('Creating article_drafts...');
    await sequelize.query(`
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
      )
    `);

    // Create article_revisions table
    console.log('Creating article_revisions...');
    await sequelize.query(`
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
      )
    `);

    // Create indexes
    console.log('⚡ Creating indexes...');
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_comments_author_id ON article_comments(author_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at)`,
      `CREATE INDEX IF NOT EXISTS idx_article_attachments_article_id ON article_attachments(article_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_attachments_uploaded_by ON article_attachments(uploaded_by)`,
      `CREATE INDEX IF NOT EXISTS idx_article_drafts_author_id ON article_drafts(author_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_drafts_last_modified ON article_drafts(last_modified)`,
      `CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_revisions_revision_number ON article_revisions(revision_number)`,
    ];

    for (const query of indexQueries) {
      await sequelize.query(query);
    }

    // Insert default data
    console.log('📝 Inserting default data...');
    await sequelize.query(`
      INSERT INTO article_categories (name, slug, description, color, icon, sort_order) VALUES
      ('Новости', 'news', 'Новости компании и индустрии', '#FF6B6B', 'newspaper', 1),
      ('Руководства', 'guides', 'Подробные руководства и инструкции', '#4ECDC4', 'book', 2),
      ('Обзоры', 'reviews', 'Обзоры продуктов и сервисов', '#45B7D1', 'star', 3),
      ('Советы', 'tips', 'Полезные советы и рекомендации', '#FFA07A', 'lightbulb', 4),
      ('Техническая поддержка', 'support', 'Техническая поддержка и FAQ', '#98D8C8', 'question-circle', 5)
      ON CONFLICT (slug) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO article_tags (name, slug, description, color) VALUES
      ('Важное', 'important', 'Важные объявления', '#FF0000'),
      ('Обновление', 'update', 'Информация об обновлениях', '#FFA500'),
      ('Новинка', 'new', 'Новые продукты и функции', '#32CD32'),
      ('Акция', 'promotion', 'Акции и скидки', '#FF69B4'),
      ('Техническое', 'technical', 'Технические статьи', '#708090')
      ON CONFLICT (slug) DO NOTHING
    `);

    console.log('✅ All tables created successfully!');
    console.log('📊 Tables created:');
    console.log('  - article_tag_relations');
    console.log('  - article_comments');
    console.log('  - article_likes');
    console.log('  - article_views');
    console.log('  - article_attachments');
    console.log('  - article_drafts');
    console.log('  - article_revisions');
    console.log('  - Default categories and tags inserted');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
createRemainingTables().catch(console.error);
