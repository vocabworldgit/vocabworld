-- VocabWorld Subscription System Database Schema
-- This schema ensures robust subscription tracking and access control

-- 1. User Subscriptions Table
-- Tracks current subscription status and details
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Status
  status TEXT NOT NULL CHECK (status IN ('free', 'active', 'past_due', 'canceled', 'expired')) DEFAULT 'free',
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')) NULL,
  
  -- Payment Platform Details
  stripe_customer_id TEXT NULL,
  stripe_subscription_id TEXT NULL,
  apple_original_transaction_id TEXT NULL,
  apple_subscription_group_id TEXT NULL,
  
  -- Subscription Timing
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  trial_end TIMESTAMPTZ NULL,
  
  -- Billing
  price_paid DECIMAL(10,2) NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Access Control
  premium_features_enabled BOOLEAN DEFAULT FALSE,
  auto_renewal_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id)
);

-- 2. Subscription Events Table  
-- Tracks all subscription-related events for audit and debugging
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created', 'subscription_updated', 'subscription_canceled',
    'payment_succeeded', 'payment_failed', 'trial_started', 'trial_ended',
    'access_granted', 'access_revoked', 'subscription_expired'
  )),
  event_source TEXT NOT NULL CHECK (event_source IN ('stripe', 'apple', 'manual', 'system')),
  
  -- Platform-specific data
  stripe_event_id TEXT NULL,
  apple_notification_type TEXT NULL,
  
  -- Event payload (for debugging)
  event_data JSONB NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Topic Access Control Table
-- Defines which topics require premium access
CREATE TABLE topic_access_rules (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('free', 'premium')) DEFAULT 'premium',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(topic_id)
);

-- 4. User Access Log Table
-- Tracks when users access premium content (for analytics and debugging)
CREATE TABLE user_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  access_granted BOOLEAN NOT NULL,
  subscription_status TEXT NOT NULL,
  
  -- Context
  user_agent TEXT NULL,
  ip_address INET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize Topic Access Rules
-- Topic 1 (Greetings) is free, all others require premium
INSERT INTO topic_access_rules (topic_id, access_level) VALUES
  (1, 'free'),   -- Greetings
  (2, 'premium'), -- Numbers  
  (3, 'premium'), -- Time & Dates
  (4, 'premium'), -- Directions & Transportation
  (5, 'premium'), -- Shopping & Money
  (6, 'premium'), -- Food, Drinks & Restaurants
  (7, 'premium'), -- Emergency & Safety
  (8, 'premium'), -- Health
  (9, 'premium'), -- Home & Household Items
  (10, 'premium'), -- Clothing & Personal Style
  (11, 'premium'), -- Weather
  (12, 'premium'), -- Family
  (13, 'premium'), -- Emotions & Feelings
  (14, 'premium'), -- Personality & Character
  (15, 'premium'), -- Hobbies & Leisure Activities
  (16, 'premium'), -- Sports & Fitness
  (17, 'premium'), -- City
  (18, 'premium'); -- Travel (add more as needed)

-- Indexes for Performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);
CREATE INDEX idx_topic_access_rules_topic_id ON topic_access_rules(topic_id);
CREATE INDEX idx_user_access_log_user_id ON user_access_log(user_id);
CREATE INDEX idx_user_access_log_created_at ON user_access_log(created_at);

-- RLS (Row Level Security) Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own events
CREATE POLICY "Users can view own events" ON subscription_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own access logs  
CREATE POLICY "Users can view own access logs" ON user_access_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscription data
CREATE POLICY "Service role full access subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access access logs" ON user_access_log
  FOR ALL USING (auth.role() = 'service_role');

-- Topic access rules are readable by all authenticated users
ALTER TABLE topic_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read topic rules" ON topic_access_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for subscription management

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION check_user_premium_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record user_subscriptions%ROWTYPE;
BEGIN
  -- Get user's subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_uuid;
  
  -- If no subscription found, user is free tier
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if subscription is active and not expired
  RETURN (
    subscription_record.status = 'active' AND
    subscription_record.premium_features_enabled = TRUE AND
    (subscription_record.current_period_end IS NULL OR subscription_record.current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check topic access for user
CREATE OR REPLACE FUNCTION check_topic_access(user_uuid UUID, topic_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  topic_access_level TEXT;
  user_has_premium BOOLEAN;
BEGIN
  -- Get topic access level
  SELECT access_level INTO topic_access_level
  FROM topic_access_rules
  WHERE topic_id = topic_id_param;
  
  -- If topic not found in rules, default to premium
  IF NOT FOUND THEN
    topic_access_level := 'premium';
  END IF;
  
  -- If topic is free, everyone can access
  IF topic_access_level = 'free' THEN
    RETURN TRUE;
  END IF;
  
  -- For premium topics, check user's subscription
  SELECT check_user_premium_access(user_uuid) INTO user_has_premium;
  
  RETURN user_has_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log access attempts
CREATE OR REPLACE FUNCTION log_topic_access(
  user_uuid UUID,
  topic_id_param INTEGER,
  access_granted_param BOOLEAN,
  user_agent_param TEXT DEFAULT NULL,
  ip_address_param INET DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  user_sub_status TEXT;
BEGIN
  -- Get user's current subscription status
  SELECT status INTO user_sub_status
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- Default to 'free' if no subscription found
  IF NOT FOUND THEN
    user_sub_status := 'free';
  END IF;
  
  -- Insert access log
  INSERT INTO user_access_log (
    user_id, topic_id, access_granted, subscription_status,
    user_agent, ip_address
  ) VALUES (
    user_uuid, topic_id_param, access_granted_param, user_sub_status,
    user_agent_param, ip_address_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger for subscription updates
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

CREATE TRIGGER trigger_update_topic_rules_timestamp
  BEFORE UPDATE ON topic_access_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();