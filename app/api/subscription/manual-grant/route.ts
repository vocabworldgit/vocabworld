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
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    const { userId, planId, customerId } = paymentIntent.metadata

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing metadata in payment intent' },
        { status: 400 }
      )
    }

    // Get plan configuration
    const planConfig = getPlanConfig(planId)
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 400 }
      )
    }

    // Create subscription in Stripe
    const subscriptionData: any = {
      customer: customerId,
      items: [{ price: planConfig.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        planId,
      },
    }

    // Add trial period if applicable
    if (planConfig.trialDays && planConfig.trialDays > 0) {
      subscriptionData.trial_period_days = planConfig.trialDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionData)
    const sub = subscription as any

    // Check if subscription exists in our database
    const { data: existingSubscription } = await supabase
      .from('stripe_subscriptions')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .eq('status', 'active')
      .single()

    if (!existingSubscription) {
      // Get user profile id from auth user id
      let { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      if (!userProfile) {
        console.log('User profile not found, attempting to create one for userId:', userId)
        
        // Try to get user data from auth.users table
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
          
          if (authUser?.user) {
            // Create user profile
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                auth_user_id: userId,
                email: authUser.user.email,
                full_name: authUser.user.user_metadata?.full_name || authUser.user.email,
                avatar_url: authUser.user.user_metadata?.avatar_url,
                provider: authUser.user.app_metadata?.provider || 'google',
                provider_id: authUser.user.user_metadata?.sub || authUser.user.id,
                preferred_language: 'en',
                learning_languages: [],
                subscription_status: 'free',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_sign_in: new Date().toISOString(),
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating user profile:', createError)
              return NextResponse.json(
                { error: 'Failed to create user profile' },
                { status: 500 }
              )
            }

            userProfile = newProfile
            console.log('Created new user profile:', userProfile.id)
          } else {
            console.error('Auth user not found:', authError)
            return NextResponse.json(
              { error: 'Auth user not found' },
              { status: 404 }
            )
          }
        } catch (error) {
          console.error('Error accessing auth user:', error)
          return NextResponse.json(
            { error: 'Failed to access user data' },
            { status: 500 }
          )
        }
      }

      // Create subscription record in our database
      const { error: subscriptionError } = await supabase
        .from('stripe_subscriptions')
        .insert({
          user_profile_id: userProfile.id,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customerId,
          stripe_price_id: planConfig.stripePriceId,
          status: 'active',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError)
        // Don't fail the request since the Stripe subscription was created successfully
      }

      // Update user profile subscription status
      await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'premium',
          subscription_platform: 'stripe',
          subscription_id: sub.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId)

      // Log the subscription event
      await supabase
        .from('subscription_history')
        .insert({
          user_profile_id: userProfile.id,
          platform: 'stripe',
          subscription_id: sub.id,
          status: 'active',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      subscriptionId: sub.id,
      message: 'Subscription created successfully',
    })
  } catch (error) {
    console.error('Manual grant error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

function getPlanConfig(planId: string) {
  const plans = {
    yearly: {
      stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_test_yearly_placeholder',
      trialDays: 7,
      interval: 'year' as const,
    },
    monthly: {
      stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_test_monthly_placeholder',
      trialDays: 0,
      interval: 'month' as const,
    },
  }

  return plans[planId as keyof typeof plans]
}