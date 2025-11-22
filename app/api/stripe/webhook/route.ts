import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { subscriptionService } from '@/lib/subscription/subscription-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
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

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
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

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const subscriptionId = paymentIntent.metadata?.subscription_id
  const userId = paymentIntent.metadata?.user_id

  if (!subscriptionId || !userId) {
    console.log('⚠️  PaymentIntent not related to subscription')
    return
  }

  console.log('💰 Payment intent succeeded')
  console.log('   Payment Intent ID:', paymentIntent.id)
  console.log('   Subscription ID:', subscriptionId)
  console.log('   User ID:', userId)

  // Fetch the subscription to get details
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover'
  })
  
  const sub = await stripe.subscriptions.retrieve(subscriptionId)

  // Activate premium
  const isActive = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'incomplete'
  
  if (isActive) {
    await subscriptionService.activatePremium(
      userId,
      sub.customer as string,
      sub.id,
      new Date((sub as any).current_period_end * 1000)
    )

    console.log('✅ Premium activated via payment intent')
    console.log('   User ID:', userId)
    console.log('   Status:', sub.status)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = (invoice as any).subscription
  
  if (!subscription || typeof subscription !== 'string') {
    console.log('⚠️  Invoice not related to subscription')
    return
  }

  console.log('💰 Invoice payment succeeded')
  console.log('   Invoice ID:', invoice.id)
  console.log('   Subscription ID:', subscription)

  // Fetch the subscription to get metadata
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover'
  })
  
  const sub = await stripe.subscriptions.retrieve(subscription)
  const userId = sub.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  // Activate premium
  const isActive = sub.status === 'active' || sub.status === 'trialing'
  
  if (isActive) {
    await subscriptionService.activatePremium(
      userId,
      sub.customer as string,
      sub.id,
      new Date((sub as any).current_period_end * 1000)
    )

    console.log('✅ Premium activated via invoice payment')
    console.log('   User ID:', userId)
    console.log('   Status:', sub.status)
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
    return
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const sub = subscription as any

  if (isActive) {
    // Activate premium
    await subscriptionService.activatePremium(
      userId,
      sub.customer as string,
      sub.id,
      new Date(sub.current_period_end * 1000)
    )

    console.log('✅ Premium activated')
    console.log('   User ID:', userId)
    console.log('   Subscription ID:', sub.id)
    console.log('   Status:', sub.status)
    console.log('   Period end:', new Date(sub.current_period_end * 1000))
  } else {
    console.log('⚠️  Subscription not active:', sub.status)
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
