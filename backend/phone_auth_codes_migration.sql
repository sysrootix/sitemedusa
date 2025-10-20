-- Migration: Create phone_auth_codes table
-- Run this SQL script to create the phone_auth_codes table for phone authentication

CREATE TABLE IF NOT EXISTS phone_auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_auth_codes_phone ON phone_auth_codes(phone);
CREATE INDEX IF NOT EXISTS idx_phone_auth_codes_phone_used ON phone_auth_codes(phone, used);
CREATE INDEX IF NOT EXISTS idx_phone_auth_codes_expires_at ON phone_auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_auth_codes_code_phone_used ON phone_auth_codes(code, phone, used);

-- Add comments
COMMENT ON TABLE phone_auth_codes IS 'Stores one-time authentication codes for phone-based login';
COMMENT ON COLUMN phone_auth_codes.phone IS 'Normalized phone number starting with +7';
COMMENT ON COLUMN phone_auth_codes.code IS '6-digit authentication code';
COMMENT ON COLUMN phone_auth_codes.expires_at IS 'When the code expires (10 minutes from creation)';
COMMENT ON COLUMN phone_auth_codes.used IS 'Whether the code has been used for authentication';
