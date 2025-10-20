#!/bin/bash

# Script to run articles migration
# Usage: ./run_articles_migration.sh

echo "🚀 Running Articles Migration..."
echo "================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with database configuration."
    echo "Example:"
    echo "DB_HOST=localhost"
    echo "DB_PORT=5432"
    echo "DB_NAME=osnova_db"
    echo "DB_USER=osnova_user"
    echo "DB_PASSWORD=your_password"
    exit 1
fi

# Run the migration
cd /root/NikitaMDA/roznica/sites/osnova/backend
npx ts-node -r tsconfig-paths/register src/scripts/run_articles_migration_step_by_step.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo "🎉 Your articles system is ready to use!"
    echo ""
    echo "Next steps:"
    echo "1. Check your database for the new tables"
    echo "2. Start your backend server: npm run dev"
    echo "3. Create your first article!"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi
