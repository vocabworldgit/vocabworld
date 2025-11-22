import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
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

    // Create Stripe checkout session
    const sessionConfig: any = {
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancelled`,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    }

    // Only add trial period if it's greater than 0
    if (planConfig.trialDays && planConfig.trialDays > 0) {
      sessionConfig.subscription_data.trial_period_days = planConfig.trialDays
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

function getPlanConfig(planId: string) {
  const plans = {
    yearly: {
      stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_test_yearly_placeholder',
      trialDays: 7,
    },
    monthly: {
      stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_test_monthly_placeholder',
      trialDays: 0,
    },
  }

  return plans[planId as keyof typeof plans]
}