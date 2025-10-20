-- Migration: Create feedback_site table
-- Run this SQL script to create the feedback_site table for storing contact form submissions

-- Create ENUM types for status and priority
DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create feedback_site table
CREATE TABLE IF NOT EXISTS feedback_site (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    telegram VARCHAR(255),
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status feedback_status NOT NULL DEFAULT 'pending',
    priority feedback_priority NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    response_sent BOOLEAN NOT NULL DEFAULT FALSE,
    response_date TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_site_status ON feedback_site(status);
CREATE INDEX IF NOT EXISTS idx_feedback_site_priority ON feedback_site(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_site_assigned_to ON feedback_site(assigned_to);
CREATE INDEX IF NOT EXISTS idx_feedback_site_created_at ON feedback_site(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_site_name ON feedback_site(name);
CREATE INDEX IF NOT EXISTS idx_feedback_site_telegram ON feedback_site(telegram);
CREATE INDEX IF NOT EXISTS idx_feedback_site_phone ON feedback_site(phone);
CREATE INDEX IF NOT EXISTS idx_feedback_site_status_created_at ON feedback_site(status, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_site_priority_status ON feedback_site(priority, status);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_site_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_feedback_site_updated_at
    BEFORE UPDATE ON feedback_site
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_site_updated_at();

-- Add comments
COMMENT ON TABLE feedback_site IS 'Stores feedback and contact form submissions from the website';
COMMENT ON COLUMN feedback_site.name IS 'Name of the person submitting feedback';
COMMENT ON COLUMN feedback_site.telegram IS 'Telegram username or contact link (optional)';
COMMENT ON COLUMN feedback_site.phone IS 'Phone number (optional)';
COMMENT ON COLUMN feedback_site.subject IS 'Subject/topic of the feedback';
COMMENT ON COLUMN feedback_site.message IS 'Main feedback message content';
COMMENT ON COLUMN feedback_site.status IS 'Current processing status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN feedback_site.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN feedback_site.assigned_to IS 'ID of the user (admin) assigned to handle this feedback';
COMMENT ON COLUMN feedback_site.notes IS 'Internal notes from administrators';
COMMENT ON COLUMN feedback_site.response_sent IS 'Whether a response has been sent to the user';
COMMENT ON COLUMN feedback_site.response_date IS 'When the response was sent';
COMMENT ON COLUMN feedback_site.ip_address IS 'IP address of the submitter';
COMMENT ON COLUMN feedback_site.user_agent IS 'Browser/client user agent string';
