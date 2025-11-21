import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus, planType, currentPeriodEnd } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Create test subscription based on status
    if (subscriptionStatus === 'free') {
      // For free users, just ensure no active subscription exists
      // The checkTopicAccess will default to free tier
      console.log(`Created test free user: ${userId}`)
    } else {
      // Create active subscription
      await subscriptionService.upsertUserSubscription(userId, {
        stripeSubscriptionId: `test_sub_${userId}`,
        stripeCustomerId: `test_cust_${userId}`,
        status: subscriptionStatus,
        planType: planType || 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      console.log(`Created test ${subscriptionStatus} user: ${userId}`)
    }

    return NextResponse.json({
      success: true,
      userId,
      subscriptionStatus,
      message: `Test user created successfully`
    })
  } catch (error) {
    console.error('Create test user error:', error)
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    )
  }
}