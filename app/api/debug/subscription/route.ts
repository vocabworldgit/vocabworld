import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService as _subscriptionService } from '@/lib/subscription/subscription-service'
import { getSupabaseServer } from '@/lib/supabase-server'
const subscriptionService = _subscriptionService as any

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServer()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Check subscription from our service
    const subscription = await subscriptionService.getUserSubscription(userId)
    const premiumAccess = await subscriptionService.checkUserPremiumAccess(userId)

    // Check raw database data
    const { data: rawSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      userId,
      subscription,
      premiumAccess,
      rawSubscription: subError ? null : rawSubscription,
      recentEvents: eventsError ? [] : events,
      debug: {
        subscriptionError: subError?.message,
        eventsError: eventsError?.message,
      }
    })
  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to debug subscription' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'grant_premium':
        // Manually grant premium for testing
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1) // 1 month from now

        const newSub = await subscriptionService.upsertUserSubscription(userId, {
          stripeSubscriptionId: 'test_sub_' + Date.now(),
          stripeCustomerId: 'test_cust_' + Date.now(),
          status: 'active',
          planType: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          trialEnd: null,
        })

        await subscriptionService.logSubscriptionEvent(
          userId,
          'manual_grant',
          { grantedBy: 'debug_endpoint', duration: '1_month' }
        )

        return NextResponse.json({ 
          message: 'Premium access granted for testing',
          subscription: newSub
        })

      case 'revoke_premium':
        // Revoke premium access
        await subscriptionService.upsertUserSubscription(userId, {
          status: 'cancelled',
          currentPeriodEnd: new Date(),
        })

        await subscriptionService.logSubscriptionEvent(
          userId,
          'manual_revoke',
          { revokedBy: 'debug_endpoint' }
        )

        return NextResponse.json({ message: 'Premium access revoked' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Debug subscription action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}