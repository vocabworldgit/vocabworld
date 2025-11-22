import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

const service = subscriptionService as any

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
        
        result = await service.upsertUserSubscription(userId, {
          status: 'active',
          planType: planType as 'monthly' | 'yearly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          stripeSubscriptionId: `admin_grant_${Date.now()}`,
          stripeCustomerId: `admin_customer_${userId.slice(0, 8)}`,
        })

        await service.logSubscriptionEvent(
          userId,
          'access_granted',
          'manual'
        )
        break

      case 'cancel':
        // Cancel subscription
        result = await service.upsertUserSubscription(userId, {
          status: 'cancelled',
          currentPeriodEnd: new Date(), // End immediately
        })

        await service.logSubscriptionEvent(
          userId,
          'access_revoked',
          'manual'
        )
        break

      case 'reactivate':
        // Reactivate subscription for 30 days
        result = await service.upsertUserSubscription(userId, {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

        await service.logSubscriptionEvent(
          userId,
          'access_granted',
          'manual'
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