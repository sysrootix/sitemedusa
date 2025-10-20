import sequelize from '../config/database';
import logger from '../utils/logger';

/**
 * Migration script to create cart_items table
 * Run with: npm run db:migrate:cart
 */

async function migrateCart() {
  try {
    logger.info('🔄 Starting cart_items table migration...');

    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
      );
    `);

    const tableExists = (results as any)[0].exists;

    if (tableExists) {
      logger.info('ℹ️  Table cart_items already exists, skipping creation');
      return;
    }

    // Create cart_items table
    await sequelize.query(`
      CREATE TABLE cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        product_id UUID NOT NULL,
        shop_code VARCHAR(255) NOT NULL,
        modification_id UUID,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user
          FOREIGN KEY(user_id) 
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT unique_cart_item 
          UNIQUE(user_id, product_id, shop_code, modification_id)
      );
    `);

    logger.info('✅ Created cart_items table');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
    `);
    logger.info('✅ Created index on user_id');

    await sequelize.query(`
      CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
    `);
    logger.info('✅ Created index on product_id');

    logger.info('✅ Cart migration completed successfully!');
  } catch (error) {
    logger.error('❌ Cart migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCart()
    .then(() => {
      logger.info('🎉 Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default migrateCart;

