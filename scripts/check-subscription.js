const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSubscription() {
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name')
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  console.log('\n📊 User Subscriptions:\n')
  
  for (const user of users) {
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    console.log(`👤 ${user.email || user.full_name}`)
    console.log(`   ID: ${user.id}`)
    
    if (subscription) {
      console.log(`   ✅ Subscription: ${subscription.status}`)
      console.log(`   Plan: ${subscription.plan_type}`)
      console.log(`   Stripe Sub ID: ${subscription.stripe_subscription_id}`)
      console.log(`   Period: ${subscription.current_period_start} to ${subscription.current_period_end}`)
    } else {
      console.log(`   ❌ No subscription found`)
    }
    console.log('')
  }

  // Also check subscription events
  const { data: events, error: eventsError } = await supabase
    .from('subscription_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (events && events.length > 0) {
    console.log('\n📝 Recent Subscription Events:\n')
    events.forEach(event => {
      console.log(`${event.created_at} - ${event.event_type}`)
      console.log(`   Data: ${JSON.stringify(event.event_data, null, 2)}`)
      console.log('')
    })
  }
}

checkSubscription()
