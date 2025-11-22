const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function checkPrices() {
  console.log('🔍 Checking Stripe configuration...\n')
  
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID
  
  console.log('Environment variables:')
  console.log(`  STRIPE_MONTHLY_PRICE_ID: ${monthlyPriceId}`)
  console.log(`  STRIPE_YEARLY_PRICE_ID: ${yearlyPriceId}\n`)
  
  // Check if prices exist
  if (monthlyPriceId && monthlyPriceId !== 'price_test_monthly_placeholder') {
    try {
      const price = await stripe.prices.retrieve(monthlyPriceId)
      console.log('✅ Monthly price exists:')
      console.log(`   ID: ${price.id}`)
      console.log(`   Amount: $${(price.unit_amount || 0) / 100}`)
      console.log(`   Recurring: ${price.recurring?.interval}`)
      console.log(`   Active: ${price.active}\n`)
    } catch (error) {
      console.log('❌ Monthly price NOT found:', error.message, '\n')
    }
  } else {
    console.log('⚠️  No monthly price ID configured\n')
  }
  
  if (yearlyPriceId && yearlyPriceId !== 'price_test_yearly_placeholder') {
    try {
      const price = await stripe.prices.retrieve(yearlyPriceId)
      console.log('✅ Yearly price exists:')
      console.log(`   ID: ${price.id}`)
      console.log(`   Amount: $${(price.unit_amount || 0) / 100}`)
      console.log(`   Recurring: ${price.recurring?.interval}`)
      console.log(`   Active: ${price.active}\n`)
    } catch (error) {
      console.log('❌ Yearly price NOT found:', error.message, '\n')
    }
  } else {
    console.log('⚠️  No yearly price ID configured\n')
  }
  
  // List all prices to help find the right ones
  console.log('📋 All active prices in Stripe:\n')
  const allPrices = await stripe.prices.list({ active: true, limit: 10 })
  
  allPrices.data.forEach(price => {
    console.log(`Price: ${price.id}`)
    console.log(`  Amount: $${(price.unit_amount || 0) / 100}`)
    console.log(`  Recurring: ${price.recurring?.interval}`)
    console.log(`  Product: ${price.product}`)
    console.log()
  })
}

checkPrices().catch(console.error)
