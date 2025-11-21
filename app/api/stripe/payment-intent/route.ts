import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing planId or userId' },
        { status: 400 }
      )
    }

    // Get user from Supabase - try both auth and profile tables
    let user
    let userError
    
    // First try to get from user_profiles
    const { data: profileUser, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profileUser) {
      user = profileUser
    } else {
      // If not found in profiles, try auth.users table
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authUser?.user) {
          user = {
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || authUser.user.email
          }
        } else {
          userError = authError
        }
      } catch (error) {
        userError = error
      }
    }

    if (!user) {
      console.error('User lookup failed:', { userId, profileError, userError })
      return NextResponse.json(
        { error: 'User not found. Please make sure you are signed in.' },
        { status: 404 }
      )
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

    // Create payment intent
    const paymentIntentData: any = {
      amount: planConfig.amount,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      setup_future_usage: 'off_session',
      metadata: {
        userId,
        planId,
        customerId: customer.id,
      },
    }

    // For subscriptions, we'll create the subscription after payment succeeds
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    })
  } catch (error) {
    console.error('Stripe payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
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