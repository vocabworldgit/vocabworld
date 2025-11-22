import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Get subscription and premium status
    const subscription = await subscriptionService.getUserSubscription(userId)
    const isPremium = await subscriptionService.isPremium(userId)
    
    return NextResponse.json({
      subscription,
      isPremium
    })
  } catch (error) {
    console.error('Subscription status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
