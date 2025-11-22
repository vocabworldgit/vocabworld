const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSubscriptions() {
  console.log('📊 Checking user_subscriptions table directly...\n')
  
  // Get all subscriptions
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
  
  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${subscriptions.length} subscriptions:\n`)
  
  // Get auth users to match emails
  const { data: { users } } = await supabase.auth.admin.listUsers()
  
  subscriptions.forEach(sub => {
    const user = users.find(u => u.id === sub.user_id)
    console.log(`📧 ${user?.email || 'Unknown'}`)
    console.log(`   User ID: ${sub.user_id}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Plan: ${sub.plan_type}`)
    console.log(`   Stripe Sub: ${sub.stripe_subscription_id}`)
    console.log(`   Period: ${sub.current_period_start} to ${sub.current_period_end}`)
    console.log(`   Premium Enabled: ${sub.premium_features_enabled}`)
    console.log('')
  })
}

checkSubscriptions()
