import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.toLowerCase()

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    // Search users by ID, email, or name
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        user_subscriptions (
          id,
          status,
          plan_type,
          current_period_start,
          current_period_end,
          stripe_customer_id,
          stripe_subscription_id,
          created_at,
          updated_at
        )
      `)
      .or(`id.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      throw error
    }

    // Format the response
    const formattedUsers = users?.map(user => {
      const subscription = user.user_subscriptions?.[0]
      
      return {
        id: subscription?.id || 'no-subscription',
        userId: user.id,
        userEmail: user.email,
        userName: user.full_name || '',
        status: subscription?.status || 'free',
        planType: subscription?.plan_type || '',
        currentPeriodStart: subscription?.current_period_start || '',
        currentPeriodEnd: subscription?.current_period_end || '',
        stripeCustomerId: subscription?.stripe_customer_id || '',
        stripeSubscriptionId: subscription?.stripe_subscription_id || '',
        createdAt: subscription?.created_at || '',
        updatedAt: subscription?.updated_at || ''
      }
    }) || []

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}