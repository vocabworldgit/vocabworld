import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { subscriptionService } from '@/lib/subscription/subscription-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('🔔 Webhook received:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in checkout session metadata')
    return
  }

  console.log('✅ Checkout completed for user:', userId)
  console.log('   Session ID:', session.id)
  console.log('   Customer ID:', session.customer)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'

  if (isActive) {
    // Activate premium
    await subscriptionService.activatePremium(
      userId,
      subscription.customer as string,
      subscription.id,
      new Date(subscription.current_period_end * 1000)
    )

    console.log('✅ Premium activated')
    console.log('   User ID:', userId)
    console.log('   Subscription ID:', subscription.id)
    console.log('   Status:', subscription.status)
    console.log('   Period end:', new Date(subscription.current_period_end * 1000))
  } else {
    console.log('⚠️  Subscription not active:', subscription.status)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  await subscriptionService.cancelSubscription(userId)

  console.log('✅ Subscription canceled')
  console.log('   User ID:', userId)
  console.log('   Subscription ID:', subscription.id)
}
