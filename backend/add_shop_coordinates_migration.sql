-- Migration: Add latitude and longitude columns to shop_locations table
-- Date: 2025-09-15

-- Drop existing columns if they exist with wrong precision
ALTER TABLE shop_locations DROP COLUMN IF EXISTS latitude;
ALTER TABLE shop_locations DROP COLUMN IF EXISTS longitude;

-- Add columns with correct precision
ALTER TABLE shop_locations
ADD COLUMN latitude DECIMAL(9, 6),
ADD COLUMN longitude DECIMAL(10, 6);

-- Create index for coordinates
CREATE INDEX IF NOT EXISTS idx_shop_locations_coordinates ON shop_locations (latitude, longitude);

-- Update some sample data with Khabarovsk coordinates (you should replace with actual coordinates)
-- Example coordinates for Khabarovsk center
UPDATE shop_locations
SET latitude = 48.480230, longitude = 135.071640
WHERE id IN (
    SELECT id FROM shop_locations
    WHERE latitude IS NULL AND longitude IS NULL AND is_active = true
    LIMIT 1
);
