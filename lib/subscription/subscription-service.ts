import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface UserSubscription {
  id: string
  user_id: string
  status: 'free' | 'premium'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

class SubscriptionService {
  /**
   * Get user's subscription status
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found - create free subscription
        return this.createFreeSubscription(userId)
      }
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  /**
   * Create a free subscription for new user
   */
  async createFreeSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        status: 'free'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating free subscription:', error)
      return null
    }

    console.log('✅ Created free subscription for user:', userId)
    return data
  }

  /**
   * Activate premium subscription (called by webhook)
   */
  async activatePremium(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    currentPeriodEnd: Date
  ): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        status: 'premium',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        current_period_end: currentPeriodEnd.toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error activating premium:', error)
      return null
    }

    console.log('✅ Premium activated for user:', userId)
    return data
  }

  /**
   * Cancel subscription (called by webhook)
   */
  async cancelSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'free',
        stripe_subscription_id: null
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error canceling subscription:', error)
      return null
    }

    console.log('✅ Subscription canceled for user:', userId)
    return data
  }

  /**
   * Check if user has premium access
   */
  async isPremium(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    
    if (!subscription) {
      return false
    }

    // Check if status is premium and not expired
    if (subscription.status === 'premium') {
      if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end)
        return periodEnd > new Date()
      }
      return true
    }

    return false
  }

  /**
   * Check topic access
   */
  async checkTopicAccess(userId: string, topicId: number): Promise<{ hasAccess: boolean, reason?: string }> {
    // Topic 1 (Greetings) is free for everyone
    if (topicId === 1) {
      return { hasAccess: true }
    }

    // All other topics require premium
    const isPremium = await this.isPremium(userId)
    
    if (isPremium) {
      return { hasAccess: true }
    }

    return { 
      hasAccess: false, 
      reason: 'Premium subscription required' 
    }
  }
}

export const subscriptionService = new SubscriptionService()
