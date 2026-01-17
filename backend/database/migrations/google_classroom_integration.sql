-- Google Classroom Integration - Database Migration
-- Add support for Google Classroom sync

-- Add Google Classroom fields to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS google_classroom_id TEXT UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add Google Classroom fields to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS google_classroom_link TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS external_assignment_id TEXT;

-- Create google_oauth_tokens table for storing OAuth credentials
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_google_classroom_id ON courses(google_classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_external_id ON assignments(external_assignment_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);

-- Add Row Level Security (RLS) policies for google_oauth_tokens
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tokens
CREATE POLICY "Users can view own tokens"
ON google_oauth_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
ON google_oauth_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
ON google_oauth_tokens FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
ON google_oauth_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE google_oauth_tokens IS 'Stores encrypted OAuth tokens for Google Classroom integration';
COMMENT ON COLUMN courses.google_classroom_id IS 'Google Classroom course ID for synced courses';
COMMENT ON COLUMN courses.sync_enabled IS 'Whether automatic sync is enabled for this course';
COMMENT ON COLUMN courses.last_synced_at IS 'Timestamp of last successful sync with Google Classroom';
COMMENT ON COLUMN assignments.google_classroom_link IS 'Direct link to assignment in Google Classroom';
COMMENT ON COLUMN assignments.external_assignment_id IS 'Google Classroom coursework ID';
