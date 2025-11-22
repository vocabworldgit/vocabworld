# Clean Subscription System Setup Guide

## ✅ What We Did

1. **Deleted all existing users** - Fresh start
2. **Created new simple schema** - Only what we need
3. **Rewrote subscription service** - Clean and simple
4. **Rewrote webhook handler** - Handles payments correctly
5. **Updated auth context** - Simple premium check

## 🚀 Setup Steps

### Step 1: Run the SQL Schema

1. Go to: https://supabase.com/dashboard/project/ripkorbuxnoljiprhlyk/sql/new
2. Copy the contents of `clean-subscription-schema.sql`
3. Paste and execute

### Step 2: Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your existing webhook
3. **Change the endpoint URL to**: `https://vocabinho.vercel.app/api/stripe/webhook-clean`
4. Keep the same webhook secret (whsec_eSK4Ts2QDfbj1UdDeimf82SoJuvjRZkh)

### Step 3: Replace Old Files with New Ones

Run these PowerShell commands:

```powershell
# Backup old files
Move-Item "lib\subscription\subscription-service.ts" "lib\subscription\subscription-service.old.ts" -Force
Move-Item "app\api\stripe\webhook\route.ts" "app\api\stripe\webhook\route.old.ts" -Force
Move-Item "contexts\auth-context.tsx" "contexts\auth-context.old.tsx" -Force

# Use new clean files
Move-Item "lib\subscription\clean-subscription-service.ts" "lib\subscription\subscription-service.ts" -Force
Move-Item "app\api\stripe\webhook-clean\route.ts" "app\api\stripe\webhook\route.ts" -Force
Move-Item "contexts\auth-context-clean.tsx" "contexts\auth-context.tsx" -Force

# Remove old webhook-clean folder
Remove-Item "app\api\stripe\webhook-clean" -Recurse -Force
```

### Step 4: Deploy

```powershell
git add .
git commit -m "Rewrite subscription system - clean and simple"
git push
vercel --prod --yes
```

## 🧪 Test Flow

1. **Sign up with Google** → New user created with 'free' status
2. **Click any topic except Greetings** → Paywall appears
3. **Complete payment** → Webhook fires → Status changes to 'premium'
4. **Click premium topic** → Access granted!

## 📊 Database Structure

**user_subscriptions** table:
- `id` - UUID
- `user_id` - FK to auth.users (CASCADE delete)
- `status` - 'free' or 'premium' (simple!)
- `stripe_customer_id` - Stripe customer
- `stripe_subscription_id` - Stripe subscription
- `current_period_end` - When premium expires
- `created_at` / `updated_at` - Timestamps

## 🔧 How It Works

### Free Users
- Status: 'free'
- Access: Only topic ID 1 (Greetings)
- All other topics: Show paywall

### Premium Users
- Status: 'premium'
- Access: All topics
- Paywall: Never shown

### Webhook Flow
1. User completes payment
2. Stripe sends `customer.subscription.created` event
3. Webhook receives userId from metadata
4. Calls `subscriptionService.activatePremium()`
5. Status changes from 'free' to 'premium'
6. User can now access all topics

## ✨ Simple and Clean!

No more:
- ❌ Complex status checks
- ❌ Multiple tables
- ❌ Confusing premium_features_enabled flags
- ❌ Wrong user IDs from user_profiles

Just:
- ✅ 'free' or 'premium'
- ✅ Topic 1 = free
- ✅ All other topics = premium only
- ✅ One simple table
- ✅ Works with auth.users IDs
