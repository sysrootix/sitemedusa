/**
 * Script to generate slugs for existing products in catalog_items table
 * Run this once after adding the slug field to populate existing data
 */

import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { generateProductSlug } from '../utils/slugify';

interface ProductRow {
  id: string;
  shop_code: string;
  name: string;
  slug: string | null;
}

async function generateSlugsForProducts() {
  try {
    console.log('🚀 Starting product slug generation...');

    // Get all products without slugs
    const products = await sequelize.query<ProductRow>(
      `SELECT id, shop_code, name, slug 
       FROM catalog_items 
       WHERE slug IS NULL OR slug = ''
       ORDER BY id, shop_code`,
      { type: QueryTypes.SELECT }
    );

    if (products.length === 0) {
      console.log('✅ All products already have slugs!');
      return;
    }

    console.log(`📊 Found ${products.length} products without slugs`);

    let successCount = 0;
    let errorCount = 0;

    // Process products in batches to avoid overwhelming the database
    const BATCH_SIZE = 100;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (product) => {
          try {
            const slug = generateProductSlug(product.name, product.shop_code);
            
            await sequelize.query(
              `UPDATE catalog_items 
               SET slug = :slug 
               WHERE id = :id AND shop_code = :shop_code`,
              {
                replacements: { 
                  slug, 
                  id: product.id, 
                  shop_code: product.shop_code 
                },
                type: QueryTypes.UPDATE
              }
            );
            
            successCount++;
            
            if (successCount % 100 === 0) {
              console.log(`✨ Processed ${successCount} products...`);
            }
          } catch (error: any) {
            errorCount++;
            console.error(`❌ Error generating slug for product ${product.id} (${product.name}):`, error.message);
          }
        })
      );
    }

    console.log('📋 Summary:');
    console.log(`  ✅ Successfully generated: ${successCount} slugs`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('🎯 Product slug generation completed!');

  } catch (error) {
    console.error('❌ Fatal error during slug generation:', error);
    throw error;
  }
}

// Run the script
generateSlugsForProducts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

