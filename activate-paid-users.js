const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function activatePaidUsers() {
  const users = [
    { userId: '70c44a2b-7f0a-4866-9ac3-81e7e1eaf9c8', subId: 'sub_1SWKuP2Oy137Zaz1jR2OuR6m', customerId: 'cus_TTHTNAovrN9SFQ' },
    { userId: 'e2364bc2-2cfc-4c08-b65e-fd9e7e314ceb', subId: 'sub_1SW8W42Oy137Zaz121ZMumRB', customerId: 'cus_TT4fqAeT43ayw1' }
  ]
  
  for (const user of users) {
    console.log(`\nActivating user: ${user.userId}`)
    
    // Get subscription details from Stripe
    const sub = await stripe.subscriptions.retrieve(user.subId)
    
    console.log('  Subscription details:', {
      status: sub.status,
      current_period_end: sub.current_period_end
    })
    
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'premium',
        stripe_customer_id: user.customerId,
        stripe_subscription_id: user.subId,
        current_period_end: periodEnd
      })
      .eq('user_id', user.userId)
      .select()

    if (error) {
      console.error('  Error:', error)
    } else {
      console.log('  ✅ Activated!')
    }
  }
}

activatePaidUsers()
