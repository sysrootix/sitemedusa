#!/bin/bash

# Script to run the feedback_site table migration
# Database connection details are loaded from .env file

set -e

echo "🚀 Starting feedback_site migration..."

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
DB_NAME=${DB_NAME:-"telegram_webapp_crm"}
DB_USER=${DB_USER:-"webapp_user"}
DB_PASSWORD=${DB_PASSWORD:-""}

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "📊 Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "👤 Using user: $DB_USER"
echo "🔐 Password: ${DB_PASSWORD:+[SET]}"

# Run the migration
echo "🔧 Executing feedback_site migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f feedback_site_migration.sql

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Created feedback_site table"
echo "  - Added ENUM types for status and priority"
echo "  - Created indexes for performance"
echo "  - Added triggers for automatic timestamps"
echo ""
echo "🎯 The feedback system is now ready to use!"
