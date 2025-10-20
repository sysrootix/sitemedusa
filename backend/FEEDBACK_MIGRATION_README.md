# Feedback Site Migration Guide

## Overview
This migration creates the `feedback_site` table for storing contact form submissions from the website.

## Prerequisites
- PostgreSQL database server running
- `psql` command-line tool installed
- Database user with permissions to create tables and indexes

## Setup

### 1. Create .env file
Create a `.env` file in the backend directory with your database credentials:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telegram_webapp_crm
DB_USER=webapp_user
DB_PASSWORD=your_actual_password_here
```

### 2. Make sure PostgreSQL is running
Ensure your PostgreSQL server is running and accessible.

### 3. Run the migration
Execute the migration script:

```bash
cd /root/NikitaMDA/roznica/sites/osnova/backend
./run_feedback_migration.sh
```

## What the migration does

### Creates table: `feedback_site`
- **id**: UUID primary key
- **name**: User's name (required)
- **telegram**: Telegram username/contact (optional)
- **phone**: Phone number (optional)
- **subject**: Message subject (required)
- **message**: Message content (required)
- **status**: Processing status (pending/in_progress/completed/cancelled)
- **priority**: Priority level (low/medium/high/urgent)
- **assigned_to**: Admin user ID assigned to handle the feedback
- **notes**: Internal admin notes
- **response_sent**: Whether response was sent to user
- **response_date**: When response was sent
- **ip_address**: User's IP address
- **user_agent**: Browser/client user agent
- **created_at**: Record creation timestamp
- **updated_at**: Record update timestamp (auto-updated)

### Creates indexes for performance:
- Status, priority, assigned_to
- Created date, name, telegram, phone
- Composite indexes for common queries

### Creates triggers:
- Automatic `updated_at` timestamp updates

## API Endpoints

After migration, these endpoints become available:

### Public endpoints:
- `POST /api/feedback` - Submit feedback from contact form

### Admin endpoints (require authentication):
- `GET /api/feedback` - List all feedback with pagination
- `GET /api/feedback/stats` - Get feedback statistics
- `GET /api/feedback/:id` - Get specific feedback by ID
- `PATCH /api/feedback/:id/status` - Update feedback status

## Troubleshooting

### Connection issues:
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env` file
3. Ensure user has proper permissions on the database

### Permission issues:
1. Make sure the database user can create tables
2. Check that the database exists and user has access to it

### Script execution issues:
1. Make sure the script is executable: `chmod +x run_feedback_migration.sh`
2. Check that you're running it from the correct directory
3. Verify `.env` file exists and has correct format

## Rollback
If you need to rollback the migration, you can drop the table:

```sql
DROP TABLE IF EXISTS feedback_site;
DROP TYPE IF EXISTS feedback_status;
DROP TYPE IF EXISTS feedback_priority;
```

## Next Steps
1. Test the contact form submission
2. Set up admin interface for managing feedback
3. Configure email notifications for new feedback (optional)
4. Set up automated responses based on feedback type (optional)
