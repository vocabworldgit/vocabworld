import { NextRequest, NextResponse } from 'next/server'
import { simpleSubscriptionService } from '@/lib/subscription/simple-subscription-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Test basic subscription functionality
    const subscription = await simpleSubscriptionService.getUserSubscription(userId)
    const isPremium = await simpleSubscriptionService.checkUserPremiumAccess(userId)
    const topicAccess = await simpleSubscriptionService.checkTopicAccess(userId, 2)

    return NextResponse.json({
      userId,
      subscription: subscription || 'none',
      isPremium,
      topicAccess,
      timestamp: new Date().toISOString(),
      status: 'working'
    })
  } catch (error) {
    console.error('System check error:', error)
    return NextResponse.json(
      { error: 'System check failed', details: String(error) },
      { status: 500 }
    )
  }
}