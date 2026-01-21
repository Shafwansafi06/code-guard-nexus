-- Migration: Add user profile fields for onboarding
-- Date: 2026-01-22

-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS subject VARCHAR(100),
ADD COLUMN IF NOT EXISTS student_count INTEGER,
ADD COLUMN IF NOT EXISTS expected_submissions INTEGER,
ADD COLUMN IF NOT EXISTS institution VARCHAR(200),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN users.full_name IS 'Full name of the user (e.g., Prof. John Smith)';
COMMENT ON COLUMN users.subject IS 'Subject or course the instructor teaches';
COMMENT ON COLUMN users.student_count IS 'Number of students in their classes';
COMMENT ON COLUMN users.expected_submissions IS 'Expected volume of assignment submissions per week';
COMMENT ON COLUMN users.institution IS 'Institution or organization name';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding flow';
