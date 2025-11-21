-- Authentication and User Management Schema
-- Run these SQL statements in your Supabase Dashboard SQL Editor

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

-- 2. Create subscription_history table for tracking subscription changes
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

-- 3. Create stripe_subscriptions table for Stripe-specific data
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create apple_subscriptions table for Apple IAP data
CREATE TABLE IF NOT EXISTS apple_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  original_transaction_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  receipt_data TEXT,
  expires_date TIMESTAMP WITH TIME ZONE,
  auto_renew_status BOOLEAN,
  is_trial_period BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON user_profiles(provider);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_profile_id ON subscription_history(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_profile_id ON stripe_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_apple_subscriptions_user_profile_id ON apple_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_apple_subscriptions_original_transaction_id ON apple_subscriptions(original_transaction_id);

-- 6. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Subscription history: Users can only see their own subscription history
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id = subscription_history.user_profile_id
    )
  );

-- Stripe subscriptions: Users can only see their own Stripe data
CREATE POLICY "Users can view own stripe subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id = stripe_subscriptions.user_profile_id
    )
  );

-- Apple subscriptions: Users can only see their own Apple data
CREATE POLICY "Users can view own apple subscriptions" ON apple_subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id = apple_subscriptions.user_profile_id
    )
  );

-- 8. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at 
  BEFORE UPDATE ON stripe_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apple_subscriptions_updated_at 
  BEFORE UPDATE ON apple_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to handle new user signup
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

-- 11. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();