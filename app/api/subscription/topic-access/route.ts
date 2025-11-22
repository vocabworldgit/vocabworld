import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, topicId } = await request.json()

    if (!userId || !topicId) {
      return NextResponse.json({ error: 'Missing userId or topicId' }, { status: 400 })
    }

    const accessResult = await subscriptionService.checkTopicAccess(userId, topicId)
    
    return NextResponse.json(accessResult)
  } catch (error) {
    console.error('Topic access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check topic access' },
      { status: 500 }
    )
  }
}