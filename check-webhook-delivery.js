const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkRecentWebhookDeliveries() {
  try {
    console.log('🔍 Checking recent webhook event deliveries...\n')

    // Get the webhook endpoint
    const webhooks = await stripe.webhookEndpoints.list()
    const webhook = webhooks.data[0]

    if (!webhook) {
      console.log('❌ No webhook found')
      return
    }

    console.log(`Webhook: ${webhook.url}\n`)

    // Get recent events
    const events = await stripe.events.list({
      limit: 5,
      types: ['payment_intent.succeeded']
    })

    for (const event of events.data) {
      console.log(`📋 Event: ${event.id}`)
      console.log(`   Type: ${event.type}`)
      console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`)
      
      const pi = event.data.object
      console.log(`   Payment Intent: ${pi.id}`)
      console.log(`   Status: ${pi.status}`)
      console.log(`   Metadata:`, pi.metadata)
      
      // Try to get delivery attempt for this event
      try {
        const attempts = await stripe.events.retrieve(event.id)
        console.log(`   Webhooks sent: ${attempts.request ? 'Yes' : 'No'}`)
      } catch (e) {
        console.log(`   Webhook delivery: Unknown`)
      }
      
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRecentWebhookDeliveries()
