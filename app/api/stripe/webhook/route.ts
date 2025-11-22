import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { subscriptionService as _subscriptionService } from '@/lib/subscription/subscription-service'
import { getSupabaseServer } from '@/lib/supabase-server'
const subscriptionService = _subscriptionService as any

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer()
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
  const sub = subscription as any
  const userId = sub.metadata?.userId
  const planId = sub.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing metadata in subscription')
    return
  }

  console.log('✅ STRIPE WEBHOOK: Subscription created', {
    subscriptionId: sub.id,
    userId,
    planId,
    status: sub.status,
  })

  const status = sub.status === 'trialing' ? 'trialing' : 
                 sub.status === 'active' ? 'active' : 'pending'

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    status,
    planType: planId as 'monthly' | 'yearly',
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
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
  const sub = subscription as any
  const userId = sub.metadata?.userId
  const planId = sub.metadata?.planId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('🔄 STRIPE WEBHOOK: Subscription updated', {
    subscriptionId: sub.id,
    userId,
    status: sub.status,
  })

  const status = sub.status === 'trialing' ? 'trialing' : 
                 sub.status === 'active' ? 'active' : 
                 sub.status === 'canceled' ? 'cancelled' : 'pending'

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    status,
    planType: planId as 'monthly' | 'yearly',
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'subscription_updated',
    {
      subscriptionId: sub.id,
      status: sub.status,
    }
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = subscription as any
  const userId = sub.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('❌ STRIPE WEBHOOK: Subscription deleted', {
    subscriptionId: sub.id,
    userId,
  })

  await subscriptionService.upsertUserSubscription(userId, {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    status: 'cancelled',
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
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
  const inv = invoice as any
  const subscription = await stripe.subscriptions.retrieve(inv.subscription as string)
  const sub = subscription as any
  const userId = sub.metadata?.userId

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
  const inv = invoice as any
  const subscription = await stripe.subscriptions.retrieve(inv.subscription as string)
  const sub = subscription as any
  const userId = sub.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  console.log('💳 STRIPE WEBHOOK: Payment failed', {
    invoiceId: inv.id,
    subscriptionId: sub.id,
    userId,
    amount: inv.amount_due,
  })

  await subscriptionService.logSubscriptionEvent(
    userId,
    'payment_failed',
    {
      invoiceId: inv.id,
      subscriptionId: sub.id,
      amount: inv.amount_due,
    }
  )
}