import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent subscription events with user details
    const { data: events, error } = await supabase
      .from('subscription_events')
      .select(`
        id,
        user_id,
        event_type,
        event_data,
        created_at,
        user_profiles!inner (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Format the response
    const formattedEvents = events?.map(event => ({
      id: event.id,
      userId: event.user_id,
      userEmail: (event.user_profiles as any)?.email || 'Unknown',
      eventType: event.event_type,
      eventData: event.event_data,
      createdAt: event.created_at
    })) || []

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}