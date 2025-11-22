import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/subscription-plans'

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

    // Get user from Supabase
    let user
    try {
      const { data: profileUser, error: profileError } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profileUser) {
        user = profileUser
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authUser?.user) {
          user = {
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || authUser.user.email
          }
        } else {
          throw new Error('User not found')
        }
      }
    } catch (error) {
      console.error('❌ User lookup failed:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get plan configuration
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Create payment intent for subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: plan.currency.toLowerCase(),
      customer_email: user.email,
      metadata: {
        userId,
        planId,
        plan_name: plan.name,
        plan_interval: plan.interval,
      },
      description: `VocabWorld ${plan.name} Subscription`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('✅ Payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('❌ Payment intent creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}