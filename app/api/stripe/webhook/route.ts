import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { subscriptionService as _subscriptionService } from '@/lib/subscription/subscription-service'
const subscriptionService = _subscriptionService as any

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  console.log('✅ STRIPE WEBHOOK: Checkout completed', {
    sessionId: session.id,
    userId,
    planId,
    amount: session.amount_total,
  })

  // The subscription will be handled by subscription.created event
  // This is mainly for logging the successful checkout
  await subscriptionService.logSubscriptionEvent(
    userId,
    'checkout_completed',
    {
      sessionId: session.id,
      planId,
      amount: session.amount_total,
    }
  )
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing metadata in subscription')
    return
  }

  console.log('✅ STRIPE WEBHOOK: Subscription created', {
    subscriptionId: subscription.id,
    userId,
    planId,
    status: subscription.status,
  })

  const status = subscription.status === 'trialing' ? 'trialing' : 
                 subscription.status === 'active' ? 'active' : 'pending'

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status,
    planType: planId as 'monthly' | 'yearly',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'subscription_created',
    {
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
    }
  )
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('🔄 STRIPE WEBHOOK: Subscription updated', {
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
  })

  const status = subscription.status === 'trialing' ? 'trialing' : 
                 subscription.status === 'active' ? 'active' : 
                 subscription.status === 'canceled' ? 'cancelled' : 'pending'

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status,
    planType: planId as 'monthly' | 'yearly',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'subscription_updated',
    {
      subscriptionId: subscription.id,
      status: subscription.status,
    }
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('❌ STRIPE WEBHOOK: Subscription deleted', {
    subscriptionId: subscription.id,
    userId,
  })

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: 'cancelled',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'subscription_cancelled',
    {
      subscriptionId: subscription.id,
    }
  )
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('💰 STRIPE WEBHOOK: Payment succeeded', {
    invoiceId: invoice.id,
    subscriptionId: subscription.id,
    userId,
    amount: invoice.amount_paid,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'payment_succeeded',
    {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      amount: invoice.amount_paid,
    }
  )
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('💳 STRIPE WEBHOOK: Payment failed', {
    invoiceId: invoice.id,
    subscriptionId: subscription.id,
    userId,
    amount: invoice.amount_due,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'payment_failed',
    {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      amount: invoice.amount_due,
    }
  )
}