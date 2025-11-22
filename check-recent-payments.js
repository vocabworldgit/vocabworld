const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkRecentPayments() {
  try {
    console.log('🔍 Checking recent payment activity...\n')

    // Get recent payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 5
    })

    console.log('💳 Recent Payment Intents:')
    for (const pi of paymentIntents.data) {
      console.log(`\n- ID: ${pi.id}`)
      console.log(`  Status: ${pi.status}`)
      console.log(`  Amount: $${(pi.amount / 100).toFixed(2)}`)
      console.log(`  Customer: ${pi.customer}`)
      console.log(`  Metadata:`, pi.metadata)
      console.log(`  Created: ${new Date(pi.created * 1000).toLocaleString()}`)
    }

    // Get recent subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 5
    })

    console.log('\n\n📋 Recent Subscriptions:')
    for (const sub of subscriptions.data) {
      console.log(`\n- ID: ${sub.id}`)
      console.log(`  Status: ${sub.status}`)
      console.log(`  Customer: ${sub.customer}`)
      console.log(`  Metadata:`, sub.metadata)
      console.log(`  Created: ${new Date(sub.created * 1000).toLocaleString()}`)
      console.log(`  Current period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} - ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRecentPayments()
