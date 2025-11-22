const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findUser() {
  const email = 'mirajtw@gmail.com'
  
  console.log(`Looking for user: ${email}\n`)
  
  // Get user from auth.users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const user = users.find(u => u.email === email)
  
  if (user) {
    console.log('Found user:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Created:', user.created_at)
    
    // Check subscription
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
      
    console.log('\nSubscription:')
    console.log('  Status:', sub?.status || 'None')
    console.log('  Stripe Customer:', sub?.stripe_customer_id || 'None')
    console.log('  Stripe Subscription:', sub?.stripe_subscription_id || 'None')
  } else {
    console.log('User not found')
  }
}

findUser()
