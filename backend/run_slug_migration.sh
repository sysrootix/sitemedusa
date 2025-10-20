#!/bin/bash

# Script to run the product slug migration
# Database connection details are loaded from .env file

set -e

echo "🚀 Starting product slug migration..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed or not in PATH"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  Warning: .env file not found. Using default values."
fi

# Database connection details from environment variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"roznica"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-""}

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "📊 Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "👤 Using user: $DB_USER"
echo "🔐 Password: ${DB_PASSWORD:+[SET]}"

# Run the migration
echo "🔧 Executing product slug migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f add_product_slug_migration.sql

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Added slug column to catalog_items table"
echo "  - Created indexes for slug searches"
echo "  - Created unique constraint on slug + shop_code"
echo ""
echo "🎯 Product slugs are now ready to use!"



