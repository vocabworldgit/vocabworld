const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkWebhookEvents() {
  try {
    console.log('🔍 Checking recent webhook events...\n')

    const events = await stripe.events.list({
      limit: 10,
      types: ['payment_intent.succeeded', 'invoice.payment_succeeded']
    })

    console.log(`Found ${events.data.length} payment events:\n`)

    for (const event of events.data) {
      console.log(`📋 ${event.type}`)
      console.log(`   Event ID: ${event.id}`)
      console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`)
      
      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object
        console.log(`   Payment Intent: ${pi.id}`)
        console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`)
        console.log(`   Metadata:`, pi.metadata)
      } else if (event.type === 'invoice.payment_succeeded') {
        const inv = event.data.object
        console.log(`   Invoice: ${inv.id}`)
        console.log(`   Subscription: ${inv.subscription}`)
        console.log(`   Amount: $${(inv.amount_paid / 100).toFixed(2)}`)
      }
      console.log('')
    }

    // Check most recent subscription
    const subs = await stripe.subscriptions.list({ limit: 1 })
    if (subs.data.length > 0) {
      const sub = subs.data[0]
      console.log('\n📊 Most recent subscription:')
      console.log(`   ID: ${sub.id}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Customer: ${sub.customer}`)
      console.log(`   Metadata:`, sub.metadata)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkWebhookEvents()
