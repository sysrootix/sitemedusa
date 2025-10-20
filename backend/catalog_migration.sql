-- Migration: Complete Catalog System for 1C Integration
-- Run this SQL script to create all tables for the catalog management system
-- This includes catalog products, shop locations, catalog exclusions, and related functionality

-- =============================================================================
-- 1. SHOP LOCATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS shop_locations (
    shop_code VARCHAR(100) PRIMARY KEY,
    shop_name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100) NOT NULL DEFAULT 'Москва',
    description TEXT,
    phone VARCHAR(50),
    working_hours VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    twogis_url VARCHAR(500),
    yandex_maps_url VARCHAR(500),
    google_maps_url VARCHAR(500),
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shop_locations
CREATE INDEX IF NOT EXISTS idx_shop_locations_city ON shop_locations(city);
CREATE INDEX IF NOT EXISTS idx_shop_locations_is_active ON shop_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_locations_priority_order ON shop_locations(priority_order);

-- Comments for shop_locations
COMMENT ON TABLE shop_locations IS 'Physical shop locations with contact and map information';
COMMENT ON COLUMN shop_locations.shop_code IS 'Unique shop code from 1C system';
COMMENT ON COLUMN shop_locations.priority_order IS 'Display order for shops (lower = higher priority)';

-- =============================================================================
-- 2. CATALOG PRODUCTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_products (
    id VARCHAR(100) NOT NULL,
    shop_code VARCHAR(100) NOT NULL REFERENCES shop_locations(shop_code) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    category_name VARCHAR(255),
    category_id VARCHAR(100),
    retail_price DECIMAL(10, 2),
    quanty DECIMAL(10, 3),
    characteristics JSONB,
    modifications JSONB,
    shop_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, shop_code)
);

-- Indexes for catalog_products
CREATE INDEX IF NOT EXISTS idx_catalog_products_name ON catalog_products(name);
CREATE INDEX IF NOT EXISTS idx_catalog_products_name_trgm ON catalog_products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category_name ON catalog_products(category_name);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_shop_code ON catalog_products(shop_code);
CREATE INDEX IF NOT EXISTS idx_catalog_products_is_active ON catalog_products(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_products_retail_price ON catalog_products(retail_price);
CREATE INDEX IF NOT EXISTS idx_catalog_products_quanty ON catalog_products(quanty);
CREATE INDEX IF NOT EXISTS idx_catalog_products_last_updated ON catalog_products(last_updated);
CREATE INDEX IF NOT EXISTS idx_catalog_products_characteristics ON catalog_products USING gin(characteristics);
CREATE INDEX IF NOT EXISTS idx_catalog_products_modifications ON catalog_products USING gin(modifications);

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Comments for catalog_products
COMMENT ON TABLE catalog_products IS 'Products catalog synced from 1C system with shop-specific availability';
COMMENT ON COLUMN catalog_products.id IS 'Product ID from 1C system';
COMMENT ON COLUMN catalog_products.shop_code IS 'Shop where this product is available';
COMMENT ON COLUMN catalog_products.quanty IS 'Available quantity in stock';
COMMENT ON COLUMN catalog_products.characteristics IS 'Product characteristics (flavors, colors, etc.)';
COMMENT ON COLUMN catalog_products.modifications IS 'Product modifications/variants';
COMMENT ON COLUMN catalog_products.is_active IS 'Whether this product is currently available';

-- =============================================================================
-- 3. CATALOG EXCLUSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exclusion_type VARCHAR(20) NOT NULL CHECK (exclusion_type IN ('product', 'category')),
    item_id VARCHAR(100) NOT NULL,
    reason TEXT,
    created_by BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (exclusion_type, item_id)
);

-- Indexes for catalog_exclusions
CREATE INDEX IF NOT EXISTS idx_catalog_exclusions_type ON catalog_exclusions(exclusion_type);
CREATE INDEX IF NOT EXISTS idx_catalog_exclusions_item_id ON catalog_exclusions(item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_exclusions_is_active ON catalog_exclusions(is_active);

-- Comments for catalog_exclusions
COMMENT ON TABLE catalog_exclusions IS 'Products or categories to be excluded from public catalog';
COMMENT ON COLUMN catalog_exclusions.exclusion_type IS 'Type of exclusion: product or category';
COMMENT ON COLUMN catalog_exclusions.item_id IS 'ID of the product or category to exclude';
COMMENT ON COLUMN catalog_exclusions.created_by IS 'Telegram ID of admin who created this exclusion';

-- =============================================================================
-- 4. CATALOG SYNC LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_code VARCHAR(100) REFERENCES shop_locations(shop_code) ON DELETE SET NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'api_trigger'
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
    products_synced INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_deactivated INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for catalog_sync_log
CREATE INDEX IF NOT EXISTS idx_catalog_sync_log_shop_code ON catalog_sync_log(shop_code);
CREATE INDEX IF NOT EXISTS idx_catalog_sync_log_status ON catalog_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_catalog_sync_log_started_at ON catalog_sync_log(started_at);

-- Comments for catalog_sync_log
COMMENT ON TABLE catalog_sync_log IS 'Log of catalog synchronization operations with 1C';
COMMENT ON COLUMN catalog_sync_log.sync_type IS 'How the sync was triggered';
COMMENT ON COLUMN catalog_sync_log.duration_ms IS 'Sync duration in milliseconds';

-- =============================================================================
-- 5. INSERT DEFAULT DATA
-- =============================================================================

-- Insert default shop location (if not exists)
INSERT INTO shop_locations (shop_code, shop_name, address, city, is_active)
VALUES ('13', 'Калинина 10', 'ул. Калинина, 10', 'Москва', TRUE)
ON CONFLICT (shop_code) DO NOTHING;

-- =============================================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_shop_locations_updated_at ON shop_locations;
CREATE TRIGGER update_shop_locations_updated_at
    BEFORE UPDATE ON shop_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_catalog_exclusions_updated_at ON catalog_exclusions;
CREATE TRIGGER update_catalog_exclusions_updated_at
    BEFORE UPDATE ON catalog_exclusions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. VIEWS FOR CONVENIENT QUERIES
-- =============================================================================

-- View: Products with shop information
CREATE OR REPLACE VIEW v_catalog_products_with_shops AS
SELECT 
    cp.id,
    cp.name,
    cp.category_name,
    cp.category_id,
    cp.retail_price,
    cp.quanty,
    cp.characteristics,
    cp.modifications,
    cp.is_active,
    cp.last_updated,
    cp.shop_code,
    sl.shop_name,
    sl.address AS shop_address,
    sl.city AS shop_city,
    sl.phone AS shop_phone,
    sl.working_hours AS shop_working_hours
FROM catalog_products cp
LEFT JOIN shop_locations sl ON cp.shop_code = sl.shop_code
WHERE cp.is_active = TRUE AND sl.is_active = TRUE;

COMMENT ON VIEW v_catalog_products_with_shops IS 'Products with full shop information for easy querying';

-- View: Products grouped by name with availability across shops
CREATE OR REPLACE VIEW v_catalog_products_grouped AS
SELECT 
    cp.name,
    cp.category_name,
    MIN(cp.retail_price) AS min_price,
    MAX(cp.retail_price) AS max_price,
    SUM(cp.quanty) AS total_quantity,
    COUNT(DISTINCT cp.shop_code) AS available_in_shops,
    ARRAY_AGG(DISTINCT cp.shop_code) AS shop_codes,
    MAX(cp.last_updated) AS last_updated
FROM catalog_products cp
WHERE cp.is_active = TRUE
GROUP BY cp.name, cp.category_name;

COMMENT ON VIEW v_catalog_products_grouped IS 'Products aggregated across all shops for catalog display';

-- =============================================================================
-- 8. USEFUL QUERIES (FOR REFERENCE)
-- =============================================================================

/*
-- Get all active products for a specific shop
SELECT * FROM catalog_products 
WHERE shop_code = '13' AND is_active = TRUE 
ORDER BY category_name, name;

-- Get products available in multiple shops
SELECT name, category_name, COUNT(*) as shop_count
FROM catalog_products
WHERE is_active = TRUE
GROUP BY name, category_name
HAVING COUNT(*) > 1
ORDER BY shop_count DESC;

-- Search products by name (fuzzy search)
SELECT * FROM catalog_products
WHERE name ILIKE '%vape%' AND is_active = TRUE
LIMIT 10;

-- Get products with low stock
SELECT * FROM catalog_products
WHERE quanty > 0 AND quanty < 5 AND is_active = TRUE
ORDER BY quanty ASC;

-- Get sync statistics
SELECT 
    shop_code,
    status,
    COUNT(*) as sync_count,
    AVG(duration_ms) as avg_duration_ms,
    SUM(products_synced) as total_products_synced
FROM catalog_sync_log
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY shop_code, status
ORDER BY shop_code, status;
*/

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Output success message
DO $$
BEGIN
    RAISE NOTICE '✅ Catalog migration completed successfully!';
    RAISE NOTICE '📋 Created tables: shop_locations, catalog_products, catalog_exclusions, catalog_sync_log';
    RAISE NOTICE '🔍 Created indexes for efficient querying';
    RAISE NOTICE '👀 Created views: v_catalog_products_with_shops, v_catalog_products_grouped';
    RAISE NOTICE '⚡ Ready to sync with 1C system';
END $$;

