-- Migration: Add slug field to catalog_items table
-- Purpose: Enable SEO-friendly URLs for products

-- Add slug column to catalog_items
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS slug VARCHAR(600);

-- Create index for slug searches
CREATE INDEX IF NOT EXISTS idx_catalog_items_slug ON catalog_items(slug);

-- Create unique index on slug + shop_code combination to ensure unique slugs per shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_slug_shop ON catalog_items(slug, shop_code);

COMMENT ON COLUMN catalog_items.slug IS 'SEO-friendly URL slug generated from product name';



