const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function activateUser() {
  const userId = '4c65a1e4-94c2-4630-845d-f21cb097478a'
  
  console.log('Activating premium for user:', userId)
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'premium',
      stripe_customer_id: 'cus_TQIjQIYIg7AUGE',
      stripe_subscription_id: 'sub_1SWAy12Oy137Zaz15XqhQ1FM',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Premium activated!')
    console.log('Data:', data)
  }
}

activateUser()
