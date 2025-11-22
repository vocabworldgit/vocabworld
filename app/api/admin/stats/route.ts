import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])

    // Get free users count (users without active subscriptions)
    const freeUsers = (totalUsers || 0) - (activeSubscriptions || 0)

    // Calculate revenue (simplified - in production, get from Stripe)
    const { data: revenueData } = await supabase
      .from('subscription_events')
      .select('event_data')
      .eq('event_type', 'payment_succeeded')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const monthlyRevenue = revenueData?.reduce((total, event) => {
      const amount = event.event_data?.amount || 0
      return total + (amount / 100) // Convert from cents
    }, 0) || 0

    // Calculate yearly revenue (last 12 months)
    const { data: yearlyRevenueData } = await supabase
      .from('subscription_events')
      .select('event_data')
      .eq('event_type', 'payment_succeeded')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    const yearlyRevenue = yearlyRevenueData?.reduce((total, event) => {
      const amount = event.event_data?.amount || 0
      return total + (amount / 100)
    }, 0) || 0

    // Calculate churn rate (simplified)
    const { count: cancelledThisMonth } = await supabase
      .from('subscription_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'subscription_cancelled')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const churnRate = activeSubscriptions ? 
      Math.round(((cancelledThisMonth || 0) / activeSubscriptions) * 100) : 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      freeUsers,
      monthlyRevenue: Math.round(monthlyRevenue),
      yearlyRevenue: Math.round(yearlyRevenue),
      churnRate
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load admin stats' },
      { status: 500 }
    )
  }
}