const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllUsers() {
  console.log('Checking all user subscriptions...\n')
  
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${subscriptions.length} subscriptions:\n`)
  
  for (const sub of subscriptions) {
    console.log(`User: ${sub.user_id}`)
    console.log(`  Status: ${sub.status}`)
    console.log(`  Stripe Customer: ${sub.stripe_customer_id || 'None'}`)
    console.log(`  Stripe Subscription: ${sub.stripe_subscription_id || 'None'}`)
    console.log(`  Period End: ${sub.current_period_end || 'N/A'}`)
    console.log(`  Created: ${sub.created_at}`)
    console.log('')
  }
}

checkAllUsers()
