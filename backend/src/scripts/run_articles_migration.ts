#!/usr/bin/env ts-node

import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '@/config';
import { Sequelize } from 'sequelize';

async function runArticlesMigration() {
  console.log('🚀 Starting articles migration...');

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

    // Read migration file
    const migrationPath = join(__dirname, '../../articles_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...');
    // Execute the entire migration as one query
    await sequelize.query(migrationSQL);

    console.log('✅ Articles migration completed successfully!');
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
runArticlesMigration().catch(console.error);
