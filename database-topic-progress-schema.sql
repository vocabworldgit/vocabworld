-- Topic Progress Tracking Schema
-- Tracks user's current position in each topic for resume functionality

-- Create table to store user's progress position in topics
CREATE TABLE IF NOT EXISTS user_topic_position (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  target_language_code TEXT NOT NULL,
  current_word_index INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one position record per user per topic per language
  UNIQUE(user_id, topic_id, target_language_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_topic_position_lookup 
ON user_topic_position(user_id, topic_id, target_language_code);

-- Enable Row Level Security
ALTER TABLE user_topic_position ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own position data
CREATE POLICY "Users can view own topic positions"
  ON user_topic_position
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic positions"
  ON user_topic_position
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic positions"
  ON user_topic_position
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_topic_position_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_user_topic_position_timestamp ON user_topic_position;
CREATE TRIGGER update_user_topic_position_timestamp
  BEFORE UPDATE ON user_topic_position
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_position_timestamp();

-- Grant permissions
GRANT ALL ON user_topic_position TO authenticated;
GRANT ALL ON user_topic_position TO service_role;
