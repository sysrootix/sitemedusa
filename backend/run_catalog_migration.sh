#!/bin/bash

# Catalog Migration Script
# This script runs the catalog migration SQL file

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          📦 Catalog System Migration Runner          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}📄 Loading environment variables from .env...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Run the migration
echo -e "${YELLOW}🚀 Running catalog migration...${NC}"
echo ""

psql "$DATABASE_URL" -f catalog_migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ Migration Completed Successfully!         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 What was created:${NC}"
    echo -e "   • shop_locations table"
    echo -e "   • catalog_products table"
    echo -e "   • catalog_exclusions table"
    echo -e "   • catalog_sync_log table"
    echo -e "   • Indexes for efficient querying"
    echo -e "   • Views for convenient data access"
    echo ""
    echo -e "${YELLOW}⚡ Next steps:${NC}"
    echo -e "   1. Start the backend server"
    echo -e "   2. Trigger manual catalog sync via API"
    echo -e "   3. Check catalog data in database"
    echo ""
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ Migration Failed!                     ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   • Check DATABASE_URL is correct"
    echo -e "   • Ensure PostgreSQL is running"
    echo -e "   • Check database permissions"
    echo -e "   • Review error messages above"
    echo ""
    exit 1
fi

