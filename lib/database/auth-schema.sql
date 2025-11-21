-- Authentication and User Management Schema
-- Add to your Supabase database

-- 1. Enable the auth extension (if not already enabled)
-- This is usually enabled by default in Supabase

-- 2. Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL, -- 'google', 'apple', 'email'
  provider_id TEXT, -- External provider ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User preferences
  preferred_language TEXT DEFAULT 'en',
  learning_languages TEXT[], -- Array of language codes
  
  -- Subscription info (will be linked to subscription system)
  subscription_status TEXT DEFAULT 'free', -- 'free', 'premium', 'trial'
  subscription_platform TEXT, -- 'stripe', 'apple', null
  subscription_id TEXT, -- External subscription ID
  
  UNIQUE(auth_user_id),
  UNIQUE(provider, provider_id)
);

-- 3. Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 4. Create subscription tracking table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'stripe', 'apple'
  external_id TEXT NOT NULL, -- Stripe customer ID or Apple transaction ID
  product_id TEXT NOT NULL, -- Plan identifier
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB, -- Store platform-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(platform, external_id)
);

-- 5. Create progress tracking table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  language_pair TEXT NOT NULL, -- e.g., 'en-es' for English to Spanish
  
  -- Progress metrics
  words_learned INTEGER DEFAULT 0,
  words_practiced INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Time tracking
  total_study_time_minutes INTEGER DEFAULT 0,
  last_studied TIMESTAMP WITH TIME ZONE,
  
  -- Difficulty and mastery
  current_difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  mastery_level DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id, language_pair)
);

-- 6. Create achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'first_lesson', 'week_streak', 'topic_complete', etc.
  achievement_data JSONB, -- Store achievement-specific data
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON user_profiles(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_platform ON user_subscriptions(platform, external_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id, language_pair);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 8. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies

-- User profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- User sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

-- User subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

-- User progress: Users can only see and modify their own progress
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can modify own progress" ON user_progress FOR ALL USING (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

-- User achievements: Users can only see their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (
  user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

-- 10. Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();