-- Migration: Create comprehensive articles system
-- Run this SQL script to create all tables for the articles management system
-- This includes articles, categories, tags, comments, likes, views, and related functionality

-- =============================================================================
-- 1. ARTICLE CATEGORIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code like #FF5733
    icon VARCHAR(50), -- Icon name or class
    parent_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for article_categories
CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);
CREATE INDEX IF NOT EXISTS idx_article_categories_parent_id ON article_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_sort_order ON article_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_article_categories_is_active ON article_categories(is_active);

-- Comments for article_categories
COMMENT ON TABLE article_categories IS 'Hierarchical categories for organizing articles';
COMMENT ON COLUMN article_categories.name IS 'Display name of the category';
COMMENT ON COLUMN article_categories.slug IS 'URL-friendly identifier for the category';
COMMENT ON COLUMN article_categories.color IS 'Hex color code for category styling';
COMMENT ON COLUMN article_categories.parent_id IS 'Parent category ID for hierarchical structure';
COMMENT ON COLUMN article_categories.sort_order IS 'Order for displaying categories';

-- =============================================================================
-- 2. ARTICLES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    reading_time INTEGER, -- Estimated reading time in minutes
    seo_title VARCHAR(60),
    seo_description VARCHAR(160),
    seo_keywords VARCHAR(255),
    meta_tags JSONB, -- Additional meta information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at ON articles(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_is_pinned ON articles(is_pinned);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_articles_seo_keywords ON articles USING gin(to_tsvector('russian', seo_keywords));
CREATE INDEX IF NOT EXISTS idx_articles_meta_tags ON articles USING gin(meta_tags);

-- Comments for articles
COMMENT ON TABLE articles IS 'Main articles table with full content and metadata';
COMMENT ON COLUMN articles.title IS 'Article title';
COMMENT ON COLUMN articles.slug IS 'URL-friendly identifier for the article';
COMMENT ON COLUMN articles.excerpt IS 'Short summary or preview text';
COMMENT ON COLUMN articles.featured_image IS 'URL to the main article image';
COMMENT ON COLUMN articles.status IS 'Publication status: draft, published, archived, scheduled';
COMMENT ON COLUMN articles.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN articles.seo_title IS 'SEO optimized title (max 60 chars)';
COMMENT ON COLUMN articles.seo_description IS 'SEO meta description (max 160 chars)';
COMMENT ON COLUMN articles.meta_tags IS 'Additional metadata in JSON format';

-- =============================================================================
-- 3. ARTICLE TAGS TABLE
-- =============================================================================

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

-- Indexes for article_tags
CREATE INDEX IF NOT EXISTS idx_article_tags_slug ON article_tags(slug);
CREATE INDEX IF NOT EXISTS idx_article_tags_name ON article_tags(name);
CREATE INDEX IF NOT EXISTS idx_article_tags_usage_count ON article_tags(usage_count);
CREATE INDEX IF NOT EXISTS idx_article_tags_is_active ON article_tags(is_active);

-- Comments for article_tags
COMMENT ON TABLE article_tags IS 'Tags for categorizing articles by topics';
COMMENT ON COLUMN article_tags.usage_count IS 'Number of articles using this tag';

-- =============================================================================
-- 4. ARTICLE TAG RELATIONS TABLE (Many-to-Many)
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, tag_id)
);

-- Indexes for article_tag_relations
CREATE INDEX IF NOT EXISTS idx_article_tag_relations_article_id ON article_tag_relations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tag_relations_tag_id ON article_tag_relations(tag_id);

-- Comments for article_tag_relations
COMMENT ON TABLE article_tag_relations IS 'Many-to-many relationship between articles and tags';

-- =============================================================================
-- 5. ARTICLE COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE, -- For nested comments
    content TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0, -- Nesting level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for article_comments
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_author_id ON article_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_is_approved ON article_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_article_comments_is_spam ON article_comments(is_spam);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_article_comments_depth ON article_comments(depth);

-- Comments for article_comments
COMMENT ON TABLE article_comments IS 'Comments and replies on articles';
COMMENT ON COLUMN article_comments.depth IS 'Nesting level for threaded comments (max 5)';

-- =============================================================================
-- 6. ARTICLE LIKES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

-- Indexes for article_likes
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_created_at ON article_likes(created_at);

-- Comments for article_likes
COMMENT ON TABLE article_likes IS 'User likes on articles';

-- =============================================================================
-- 7. ARTICLE VIEWS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255), -- For tracking unique sessions
    UNIQUE(article_id, user_id, session_id, DATE(viewed_at))
);

-- Indexes for article_views
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_ip_address ON article_views(ip_address);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_article_views_session_id ON article_views(session_id);

-- Comments for article_views
COMMENT ON TABLE article_views IS 'Article view tracking with session management';

-- =============================================================================
-- 8. ARTICLE ATTACHMENTS TABLE
-- =============================================================================

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

-- Indexes for article_attachments
CREATE INDEX IF NOT EXISTS idx_article_attachments_article_id ON article_attachments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_attachments_uploaded_by ON article_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_article_attachments_mime_type ON article_attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_article_attachments_sort_order ON article_attachments(sort_order);

-- Comments for article_attachments
COMMENT ON TABLE article_attachments IS 'File attachments for articles (images, documents, etc.)';
COMMENT ON COLUMN article_attachments.alt_text IS 'Alt text for accessibility and SEO';
COMMENT ON COLUMN article_attachments.is_featured IS 'Whether this attachment is the featured image';

-- =============================================================================
-- 9. ARTICLE DRAFTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE, -- NULL if it's a new article draft
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
    expires_at TIMESTAMP WITH TIME ZONE -- Drafts expire after some time
);

-- Indexes for article_drafts
CREATE INDEX IF NOT EXISTS idx_article_drafts_article_id ON article_drafts(article_id);
CREATE INDEX IF NOT EXISTS idx_article_drafts_author_id ON article_drafts(author_id);
CREATE INDEX IF NOT EXISTS idx_article_drafts_last_modified ON article_drafts(last_modified);
CREATE INDEX IF NOT EXISTS idx_article_drafts_expires_at ON article_drafts(expires_at);

-- Comments for article_drafts
COMMENT ON TABLE article_drafts IS 'Temporary drafts for articles being written';
COMMENT ON COLUMN article_drafts.auto_saved IS 'Whether this draft was auto-saved';

-- =============================================================================
-- 10. ARTICLE REVISIONS TABLE
-- =============================================================================

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

-- Indexes for article_revisions
CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_author_id ON article_revisions(author_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_revision_number ON article_revisions(revision_number);
CREATE INDEX IF NOT EXISTS idx_article_revisions_created_at ON article_revisions(created_at);

-- Comments for article_revisions
COMMENT ON TABLE article_revisions IS 'Version history for articles';
COMMENT ON COLUMN article_revisions.change_summary IS 'Summary of changes made in this revision';

-- =============================================================================
-- 11. TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for all tables
CREATE TRIGGER update_article_categories_updated_at BEFORE UPDATE ON article_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_tags_updated_at BEFORE UPDATE ON article_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_comments_updated_at BEFORE UPDATE ON article_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_attachments_updated_at BEFORE UPDATE ON article_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET comment_count = comment_count - 1 WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for updating comment counts
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON article_comments
    FOR EACH ROW EXECUTE FUNCTION update_article_comment_count();

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET like_count = like_count + 1 WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET like_count = like_count - 1 WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for updating like counts
CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON article_likes
    FOR EACH ROW EXECUTE FUNCTION update_article_like_count();

-- Function to update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE article_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE article_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for updating tag usage counts
CREATE TRIGGER trigger_update_tag_usage_count
    AFTER INSERT OR DELETE ON article_tag_relations
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to update view counts (only for unique views)
CREATE OR REPLACE FUNCTION update_article_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE articles SET view_count = view_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating view counts
CREATE TRIGGER trigger_update_view_count
    AFTER INSERT ON article_views
    FOR EACH ROW EXECUTE FUNCTION update_article_view_count();

-- =============================================================================
-- 12. INITIAL DATA
-- =============================================================================

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

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Add final comments
COMMENT ON DATABASE CURRENT_DATABASE IS 'Articles system migration completed successfully';
