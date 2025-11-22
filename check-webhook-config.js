const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkWebhookConfig() {
  try {
    console.log('🔍 Checking webhook endpoints...\n')

    const webhooks = await stripe.webhookEndpoints.list()

    for (const webhook of webhooks.data) {
      console.log(`📌 Webhook: ${webhook.id}`)
      console.log(`   URL: ${webhook.url}`)
      console.log(`   Status: ${webhook.status}`)
      console.log(`   Events:`)
      webhook.enabled_events.forEach(event => {
        console.log(`     - ${event}`)
      })
      console.log('')
    }

    if (webhooks.data.length === 0) {
      console.log('❌ No webhooks configured!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkWebhookConfig()
