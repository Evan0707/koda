-- Add Gmail OAuth columns to users table
-- Run this in Supabase SQL Editor if drizzle-kit push doesn't work

ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMP;
