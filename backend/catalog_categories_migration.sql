-- Migration for catalog categories with hierarchy support
-- Run this after the main catalog_migration.sql

-- Drop existing table if needed
DROP TABLE IF EXISTS catalog_categories CASCADE;

-- Create catalog_categories table for hierarchical category structure
CREATE TABLE catalog_categories (
  id VARCHAR(100) NOT NULL,
  shop_code VARCHAR(100) NOT NULL,
  name VARCHAR(500) NOT NULL,
  parent_id VARCHAR(100),
  parent_shop_code VARCHAR(100),
  level INTEGER NOT NULL DEFAULT 0,
  full_path TEXT,
  quanty INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, shop_code)
);

-- Create indexes for better performance
CREATE INDEX idx_catalog_categories_shop ON catalog_categories(shop_code);
CREATE INDEX idx_catalog_categories_parent ON catalog_categories(parent_id, parent_shop_code);
CREATE INDEX idx_catalog_categories_name ON catalog_categories(name);
CREATE INDEX idx_catalog_categories_level ON catalog_categories(level);
CREATE INDEX idx_catalog_categories_active ON catalog_categories(is_active);
CREATE INDEX idx_catalog_categories_path ON catalog_categories USING gin(to_tsvector('russian', full_path));
CREATE INDEX idx_catalog_categories_sort ON catalog_categories(shop_code, parent_id, sort_order);

-- Create new table for products with category reference
DROP TABLE IF EXISTS catalog_items CASCADE;

CREATE TABLE catalog_items (
  id VARCHAR(100) NOT NULL,
  shop_code VARCHAR(100) NOT NULL,
  category_id VARCHAR(100) NOT NULL,
  name VARCHAR(500) NOT NULL,
  quanty DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  characteristics JSONB,
  modifications JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, shop_code),
  FOREIGN KEY (category_id, shop_code) REFERENCES catalog_categories(id, shop_code) ON DELETE CASCADE
);

-- Create indexes for catalog_items
CREATE INDEX idx_catalog_items_shop ON catalog_items(shop_code);
CREATE INDEX idx_catalog_items_category ON catalog_items(category_id, shop_code);
CREATE INDEX idx_catalog_items_name ON catalog_items USING gin(to_tsvector('russian', name));
CREATE INDEX idx_catalog_items_active ON catalog_items(is_active);
CREATE INDEX idx_catalog_items_price ON catalog_items(retail_price);
CREATE INDEX idx_catalog_items_updated ON catalog_items(last_updated);

-- Create a view for category tree with product counts
CREATE OR REPLACE VIEW v_catalog_category_tree AS
WITH RECURSIVE category_tree AS (
  -- Base case: root categories (level 0)
  SELECT 
    c.id,
    c.shop_code,
    c.name,
    c.parent_id,
    c.level,
    c.full_path,
    c.quanty,
    c.is_active,
    c.sort_order,
    c.name::TEXT as path,
    ARRAY[c.id]::VARCHAR[] as id_path,
    (SELECT COUNT(*) FROM catalog_items p WHERE p.category_id = c.id AND p.shop_code = c.shop_code AND p.is_active = TRUE) as direct_products_count
  FROM catalog_categories c
  WHERE c.parent_id IS NULL AND c.is_active = TRUE
  
  UNION ALL
  
  -- Recursive case: child categories
  SELECT 
    c.id,
    c.shop_code,
    c.name,
    c.parent_id,
    c.level,
    c.full_path,
    c.quanty,
    c.is_active,
    c.sort_order,
    (ct.path || ' > ' || c.name)::TEXT as path,
    ct.id_path || c.id,
    (SELECT COUNT(*) FROM catalog_items p WHERE p.category_id = c.id AND p.shop_code = c.shop_code AND p.is_active = TRUE) as direct_products_count
  FROM catalog_categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id AND c.shop_code = ct.shop_code
  WHERE c.is_active = TRUE
)
SELECT 
  ct.*,
  (
    WITH RECURSIVE subcats AS (
      SELECT id, shop_code FROM catalog_categories WHERE id = ct.id AND shop_code = ct.shop_code
      UNION ALL
      SELECT c.id, c.shop_code FROM catalog_categories c
      INNER JOIN subcats s ON c.parent_id = s.id AND c.shop_code = s.shop_code
    )
    SELECT COUNT(DISTINCT p.id)
    FROM subcats s
    LEFT JOIN catalog_items p ON p.category_id = s.id AND p.shop_code = s.shop_code AND p.is_active = TRUE
  ) as total_products_count
FROM category_tree ct
ORDER BY ct.level, ct.sort_order, ct.name;

-- Comments
COMMENT ON TABLE catalog_categories IS 'Иерархическая структура категорий каталога товаров';
COMMENT ON COLUMN catalog_categories.id IS 'Уникальный идентификатор категории из 1С';
COMMENT ON COLUMN catalog_categories.parent_id IS 'ID родительской категории для построения иерархии';
COMMENT ON COLUMN catalog_categories.level IS 'Уровень вложенности (0 = корневая категория)';
COMMENT ON COLUMN catalog_categories.full_path IS 'Полный путь категории через разделитель';
COMMENT ON COLUMN catalog_categories.sort_order IS 'Порядок сортировки категорий';

COMMENT ON TABLE catalog_items IS 'Товары каталога с привязкой к категориям';
COMMENT ON COLUMN catalog_items.category_id IS 'ID категории к которой принадлежит товар';
COMMENT ON COLUMN catalog_items.modifications IS 'JSON с модификациями товара (размер, вкус и т.д.)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Catalog categories migration completed successfully!';
  RAISE NOTICE '📦 Created tables:';
  RAISE NOTICE '   - catalog_categories (hierarchical categories)';
  RAISE NOTICE '   - catalog_items (products with category references)';
  RAISE NOTICE '📊 Created views:';
  RAISE NOTICE '   - v_catalog_category_tree (category tree with counts)';
END $$;

