const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkRecentCheckouts() {
  try {
    console.log('🔍 Checking recent Stripe Checkout sessions...\n')

    const sessions = await stripe.checkout.sessions.list({
      limit: 10
    })

    console.log(`Found ${sessions.data.length} checkout sessions:\n`)

    for (const session of sessions.data) {
      console.log(`Session: ${session.id}`)
      console.log(`  Status: ${session.status}`)
      console.log(`  Payment status: ${session.payment_status}`)
      console.log(`  Customer: ${session.customer}`)
      console.log(`  Subscription: ${session.subscription}`)
      console.log(`  Metadata:`, session.metadata)
      console.log(`  Created: ${new Date(session.created * 1000).toLocaleString()}`)
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRecentCheckouts()
