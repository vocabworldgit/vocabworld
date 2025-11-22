import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer, getStripeServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer()
  const stripe = getStripeServer()
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing planId or userId' },
        { status: 400 }
      )
    }

    // Get user from auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser?.user) {
      console.error('User lookup failed:', { userId, authError })
      return NextResponse.json(
        { error: 'User not found. Please make sure you are signed in.' },
        { status: 404 }
      )
    }

    const user = {
      email: authUser.user.email,
      full_name: authUser.user.user_metadata?.full_name || authUser.user.email
    }

    // Get plan configuration
    const planConfig = getPlanConfig(planId)
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Create or retrieve customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId,
        },
      })
    }

    // Create subscription with pending invoice
    const subscriptionData: any = {
      customer: customer.id,
      items: [{
        price: planConfig.stripePriceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice'],
      metadata: {
        userId,
        planId,
      },
    }

    // Add trial if applicable
    if (planConfig.trialDays && planConfig.trialDays > 0) {
      subscriptionData.trial_period_days = planConfig.trialDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionData)

    console.log('✅ Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      latest_invoice: subscription.latest_invoice
    })

    // Get invoice from expanded subscription
    const invoice = (subscription as any).latest_invoice

    console.log('📄 Invoice from subscription:', {
      invoice_id: invoice?.id,
      invoice_status: invoice?.status,
      amount_due: invoice?.amount_due,
    })

    // Handle trial subscriptions with zero-amount invoices
    if (invoice?.amount_due === 0) {
      console.log('🆓 Zero-amount invoice (trial period), creating setup intent...')
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          subscription_id: subscription.id,
          user_id: userId
        }
      })
      
      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        subscriptionId: subscription.id,
        customerId: customer.id,
        setupMode: true
      })
    }

    // For non-zero invoices, get or create the payment intent for the invoice
    console.log('💳 Getting payment intent for invoice...')
    
    // Finalize the invoice to get its payment intent
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: false, // Don't auto-charge, we'll collect payment manually
    })

    // Now get the payment intent that Stripe created for this invoice
    let paymentIntent
    if (finalizedInvoice.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(
        finalizedInvoice.payment_intent as string
      )
    } else {
      // If no payment intent exists, create one for the invoice
      paymentIntent = await stripe.paymentIntents.create({
        amount: finalizedInvoice.amount_due,
        currency: 'usd',
        customer: customer.id,
        metadata: {
          subscription_id: subscription.id,
          invoice_id: finalizedInvoice.id,
          user_id: userId
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })
      
      // Update the invoice to use this payment intent
      await stripe.invoices.update(finalizedInvoice.id, {
        payment_intent: paymentIntent.id
      })
    }

    console.log('✅ Payment intent ready:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      has_client_secret: !!paymentIntent.client_secret
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('❌ Stripe subscription error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      raw: error
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

function getPlanConfig(planId: string) {
  const plans = {
    yearly: {
      amount: 2900, // $29.00 in cents
      stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_test_yearly_placeholder',
      trialDays: 7,
      interval: 'year' as const,
      name: 'VocabWorld Unlimited - Yearly',
    },
    monthly: {
      amount: 499, // $4.99 in cents
      stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_test_monthly_placeholder',
      trialDays: 0,
      interval: 'month' as const,
      name: 'VocabWorld Unlimited - Monthly',
    },
  }

  return plans[planId as keyof typeof plans]
}