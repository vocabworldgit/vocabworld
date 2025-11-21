import { NextRequest, NextResponse } from 'next/server'
import { simpleSubscriptionService } from '@/lib/subscription/simple-subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, topicId } = await request.json()

    if (!userId || !topicId) {
      return NextResponse.json({ error: 'Missing userId or topicId' }, { status: 400 })
    }

    const accessResult = await simpleSubscriptionService.checkTopicAccess(userId, topicId)
    
    // Log the access attempt
    await simpleSubscriptionService.logTopicAccess(
      userId,
      topicId,
      accessResult.hasAccess,
      request.headers.get('user-agent') || 'unknown'
    )
    
    return NextResponse.json(accessResult)
  } catch (error) {
    console.error('Topic access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check topic access' },
      { status: 500 }
    )
  }
}