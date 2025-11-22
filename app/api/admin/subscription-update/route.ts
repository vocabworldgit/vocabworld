import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, action, data } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing userId or action' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'grant_premium':
        // Grant premium access for specified days
        const days = data?.days || 30
        const planType = data?.planType || 'yearly'
        
        result = await (subscriptionService as any).upsertUserSubscription(userId, {
          status: 'active',
          planType: planType as 'monthly' | 'yearly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          stripeSubscriptionId: `admin_grant_${Date.now()}`,
          stripeCustomerId: `admin_customer_${userId.slice(0, 8)}`,
        })

        await (subscriptionService as any).logSubscriptionEvent(
          userId,
          'access_granted',
          'manual'
        )
        break

      case 'cancel':
        // Cancel subscription
        result = await subscriptionService.upsertUserSubscription(userId, {
          status: 'cancelled',
          currentPeriodEnd: new Date(), // End immediately
        })

        await subscriptionService.logSubscriptionEvent(
          userId,
          'admin_cancel_subscription',
          { cancelledBy: 'admin' }
        )
        break

      case 'reactivate':
        // Reactivate subscription for 30 days
        result = await subscriptionService.upsertUserSubscription(userId, {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

        await subscriptionService.logSubscriptionEvent(
          userId,
          'admin_reactivate_subscription',
          { reactivatedBy: 'admin' }
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      result
    })
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}