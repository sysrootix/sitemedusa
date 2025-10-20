-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique constraint: one user can favorite a product only once
    UNIQUE(user_id, product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Add comments
COMMENT ON TABLE favorites IS 'User favorite products';
COMMENT ON COLUMN favorites.id IS 'Primary key UUID';
COMMENT ON COLUMN favorites.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN favorites.product_id IS 'Product ID from 1C database';
COMMENT ON COLUMN favorites.product_name IS 'Product name for quick access';
COMMENT ON COLUMN favorites.product_data IS 'Additional product data (price, image, etc.)';
COMMENT ON COLUMN favorites.created_at IS 'When the product was added to favorites';

