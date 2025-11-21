# 🚀 Setup Guide for Your Existing Supabase Project

## Step 1: Get Your Supabase API Keys

1. **Go to your Supabase dashboard:**
   https://supabase.com/dashboard/project/ripkorbuxnoljiprhlyk/settings/api

2. **Copy these values to your `.env.local` file:**
   - **Project URL:** `https://ripkorbuxnoljiprhlyk.supabase.co` (already filled)
   - **anon/public key:** Copy from dashboard → Replace `YOUR_SUPABASE_ANON_KEY_HERE`
   - **service_role key:** Copy from dashboard → Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE`

## Step 2: Add Authentication Tables to Your Database

1. **Go to SQL Editor:**
   https://supabase.com/dashboard/project/ripkorbuxnoljiprhlyk/sql

2. **Copy and run this SQL:**

```sql
-- Authentication tables for VOCO app
-- Add to your existing vocabulary database

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'email')),
  provider_id TEXT,
  preferred_language TEXT DEFAULT 'en',
  learning_languages TEXT[] DEFAULT '{}',
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  subscription_platform TEXT CHECK (subscription_platform IN ('stripe', 'apple')),
  subscription_id TEXT,
  stripe_customer_id TEXT,
  apple_receipt_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(apple_receipt_id)
);

-- 2. Create user progress tracking table (links to your vocabulary)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id, vocabulary_id, language_code)
);

-- 3. Create subscription history for tracking changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('stripe', 'apple')),
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'trial', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id = user_progress.user_profile_id
    )
  );

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id = user_progress.user_profile_id
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_profile_id ON user_progress(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_vocabulary_id ON user_progress(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);

-- 7. Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    auth_user_id,
    email,
    full_name,
    avatar_url,
    provider,
    provider_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'email'),
    NEW.raw_user_meta_data->>'sub'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 3: Set up Google OAuth

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Create OAuth 2.0 Client ID:**
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:3001/auth/callback
     https://ripkorbuxnoljiprhlyk.supabase.co/auth/v1/callback
     ```

3. **Copy Client ID to `.env.local`:**
   Replace `YOUR_GOOGLE_CLIENT_ID_HERE`

## Step 4: Configure Supabase Authentication

1. **Go to Authentication settings:**
   https://supabase.com/dashboard/project/ripkorbuxnoljiprhlyk/auth/providers

2. **Enable Google Provider:**
   - Toggle on "Google"
   - Add your Google Client ID and Client Secret
   - Save

3. **Enable Apple Provider (optional):**
   - Toggle on "Apple"
   - Configure Apple settings if needed

## Step 5: Test Your Setup

1. **Visit the test page:**
   ```
   http://localhost:3001/test-auth
   ```

2. **Click "System Check" tab and run tests**

3. **Test Google sign-in**

## 🎯 Quick Test Commands

```bash
# Check if environment is set up
npm run setup-auth

# Start development server (should be running on port 3001)
npm run dev

# Visit test page
open http://localhost:3001/test-auth
```

## ✅ Checklist

- [ ] Supabase API keys added to `.env.local`
- [ ] Authentication SQL schema run in Supabase
- [ ] Google OAuth credentials created
- [ ] Google provider enabled in Supabase
- [ ] Test page shows all green checkmarks
- [ ] Google sign-in works

## 🎉 You're Ready!

Once these steps are complete, you'll have:
- ✅ User authentication (Google & Apple)
- ✅ User profiles linked to your vocabulary database
- ✅ Progress tracking system ready
- ✅ Subscription system foundation
- ✅ Everything integrated with your existing word database

The authentication system will seamlessly integrate with your existing vocabulary and topics tables!