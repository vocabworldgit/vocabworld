import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { topicId, userId } = await request.json()

    if (!topicId) {
      return NextResponse.json(
        { error: 'Missing topicId' },
        { status: 400 }
      )
    }

    let hasAccess = false

    if (!userId) {
      // Unauthenticated user - only greetings allowed
      hasAccess = topicId === 1
    } else {
      // Check subscription access
      const accessResult = await subscriptionService.checkTopicAccess(userId, topicId)
      hasAccess = accessResult.hasAccess
      
      // Log the access attempt for debugging
      await subscriptionService.logTopicAccess(
        userId,
        topicId,
        hasAccess,
        'Test Script'
      )
    }

    return NextResponse.json({
      hasAccess,
      topicId,
      userId: userId || 'unauthenticated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Topic access test error:', error)
    return NextResponse.json(
      { error: 'Failed to check topic access' },
      { status: 500 }
    )
  }
}