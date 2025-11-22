const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function activateSubscription(email) {
  // Get user from auth.users using admin API
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching users:', authError)
    return
  }

  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.error('User not found:', email)
    return
  }

  const userId = user.id
  console.log(`Found user: ${email} (${userId})`)

  // Create a test subscription
  const subscription = {
    user_id: userId,
    stripe_subscription_id: 'sub_test_' + Date.now(),
    stripe_customer_id: 'cus_test_' + Date.now(),
    status: 'active',
    plan_type: 'monthly',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    trial_end: null,
    premium_features_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscription, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating subscription:', error)
    return
  }

  console.log('✅ Subscription activated successfully!')
  console.log(data)

  // Log the event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'subscription_created',
      event_source: 'manual',
      event_data: { trigger: 'manual_activation_script' }
    })

  console.log('\n✅ Done! User now has active subscription.')
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/activate-subscription.js <email>')
  console.log('Example: node scripts/activate-subscription.js user@example.com')
  process.exit(1)
}

activateSubscription(email)
