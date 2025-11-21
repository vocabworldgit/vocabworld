-- Supabase Database Schema for Vocabulary App
-- Run these SQL statements in your Supabase Dashboard SQL Editor

-- 1. Create topics table (if not exists or needs modification)
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create vocabulary table 
CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  word_en TEXT NOT NULL,
  context TEXT,
  part_of_speech TEXT,
  difficulty_level TEXT, -- Changed from INTEGER to TEXT to match SQLite
  frequency_rank INTEGER,
  learning_order INTEGER,
  example_sentence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create vocabulary_translations table
CREATE TABLE IF NOT EXISTS vocabulary_translations (
  id SERIAL PRIMARY KEY,
  vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id),
  language_code TEXT NOT NULL,
  translated_word TEXT NOT NULL,
  context TEXT,
  confidence_score REAL, -- This column might be missing
  translation_source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create topic_translations table  
CREATE TABLE IF NOT EXISTS topic_translations (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  language_code TEXT NOT NULL,
  translated_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_topic_id ON vocabulary(topic_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_translations_vocab_id ON vocabulary_translations(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_translations_lang ON vocabulary_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_topic_translations_topic_id ON topic_translations(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_translations_lang ON topic_translations(language_code);

-- 6. Enable Row Level Security (optional but recommended)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_translations ENABLE ROW LEVEL SECURITY;

-- 7. Create policies to allow public read access
CREATE POLICY "Allow public read access on topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access on vocabulary" ON vocabulary FOR SELECT USING (true);
CREATE POLICY "Allow public read access on vocabulary_translations" ON vocabulary_translations FOR SELECT USING (true);
CREATE POLICY "Allow public read access on topic_translations" ON topic_translations FOR SELECT USING (true);

-- Note: If you already have some tables, you might need to:
-- 1. Add missing columns: ALTER TABLE vocabulary_translations ADD COLUMN confidence_score REAL;
-- 2. Change column types: ALTER TABLE vocabulary ALTER COLUMN difficulty_level TYPE TEXT;