const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkLastPayment() {
  console.log('🔍 Checking recent Stripe activity...\n')
  
  // Get recent checkout sessions
  const sessions = await stripe.checkout.sessions.list({
    limit: 5
  })
  
  console.log(`📋 Recent checkout sessions (${sessions.data.length}):\n`)
  
  sessions.data.forEach((session, i) => {
    console.log(`${i + 1}. Session ${session.id}`)
    console.log(`   Status: ${session.payment_status}`)
    console.log(`   Email: ${session.customer_email}`)
    console.log(`   Amount: $${(session.amount_total || 0) / 100}`)
    console.log(`   Metadata userId: ${session.metadata?.userId || 'MISSING'}`)
    console.log(`   Subscription: ${session.subscription || 'none'}`)
    console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`)
    console.log()
  })
  
  // Get recent subscriptions
  const subscriptions = await stripe.subscriptions.list({
    limit: 5
  })
  
  console.log(`📊 Recent subscriptions (${subscriptions.data.length}):\n`)
  
  for (const sub of subscriptions.data) {
    console.log(`Subscription ${sub.id}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Customer: ${sub.customer}`)
    console.log(`   Metadata userId: ${sub.metadata?.userId || 'MISSING ⚠️'}`)
    console.log(`   Period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} - ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`)
    console.log()
  }
  
  // Check webhook events
  const events = await stripe.events.list({
    limit: 10,
    types: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated']
  })
  
  console.log(`🔔 Recent webhook events (${events.data.length}):\n`)
  
  events.data.forEach((event, i) => {
    console.log(`${i + 1}. ${event.type}`)
    console.log(`   Event ID: ${event.id}`)
    console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log(`   Session: ${session.id}`)
      console.log(`   Metadata userId: ${session.metadata?.userId || 'MISSING'}`)
    } else if (event.type.includes('subscription')) {
      const sub = event.data.object
      console.log(`   Subscription: ${sub.id}`)
      console.log(`   Metadata userId: ${sub.metadata?.userId || 'MISSING'}`)
    }
    console.log()
  })
}

checkLastPayment().catch(console.error)
