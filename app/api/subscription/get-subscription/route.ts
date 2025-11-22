import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const subscription = await subscriptionService.getUserSubscription(userId)
    
    return NextResponse.json({ 
      subscription: subscription || null
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}