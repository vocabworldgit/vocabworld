import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid userIds array' },
        { status: 400 }
      )
    }

    // Clean up test subscriptions
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .delete()
      .in('user_id', userIds)

    if (subscriptionError) {
      console.warn('Error cleaning up subscriptions:', subscriptionError)
    }

    // Clean up test access logs
    const { error: logError } = await supabase
      .from('user_access_log')
      .delete()
      .in('user_id', userIds)

    if (logError) {
      console.warn('Error cleaning up access logs:', logError)
    }

    console.log(`Cleaned up test users: ${userIds.join(', ')}`)

    return NextResponse.json({
      success: true,
      cleanedUsers: userIds,
      message: 'Test data cleaned up successfully'
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup test data' },
      { status: 500 }
    )
  }
}