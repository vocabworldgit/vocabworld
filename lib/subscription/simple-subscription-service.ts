import { createClient } from '@supabase/supabase-js'

// Create server-side client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserSubscription {
  id: string
  userId: string
  status: 'free' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired'
  planType?: 'monthly' | 'yearly'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AccessResult {
  hasAccess: boolean
  reason: string
  subscription?: UserSubscription
}

class SimpleSubscriptionService {
  async checkUserPremiumAccess(userId: string): Promise<boolean> {
    try {
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, subscription_status')
        .eq('auth_user_id', userId)
        .single()

      if (!userProfile) {
        console.log('User profile not found for premium check, userId:', userId)
        
        // If profile doesn't exist, they're definitely not premium
        if (profileError?.code === 'PGRST116') {
          return false // No profile = free user
        }
        
        // For other errors, log but default to free
        console.error('Error fetching user profile:', profileError)
        return false
      }

      // Quick check from user profile
      if (userProfile.subscription_status === 'premium') {
        // Double-check with Stripe subscription data
        // Don't filter by status - check ALL subscriptions for this user
        const { data: stripeSubscription } = await supabase
          .from('stripe_subscriptions')
          .select('status, current_period_end, cancel_at_period_end')
          .eq('user_profile_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (stripeSubscription) {
          // Check if subscription is still valid based on period end date
          // Even cancelled subscriptions should work until period ends
          const notExpired = stripeSubscription.current_period_end && 
                            new Date(stripeSubscription.current_period_end) > new Date()
          
          // Also check if status is active or trialing
          const hasValidStatus = ['active', 'trialing'].includes(stripeSubscription.status)
          
          // User has access if subscription is not expired AND has valid status
          // OR if subscription is cancelled but still within paid period
          return notExpired && (hasValidStatus || stripeSubscription.status === 'canceled')
        }
      }

      return false
    } catch (error) {
      console.error('Error checking premium access:', error)
      return false
    }
  }

  async checkTopicAccess(userId: string, topicId: number): Promise<AccessResult> {
    try {
      // Topic 1 (greetings) is always free
      if (topicId === 1) {
        return {
          hasAccess: true,
          reason: 'Free topic available to all users'
        }
      }

      // Check premium access for other topics
      const hasPremium = await this.checkUserPremiumAccess(userId)
      
      if (hasPremium) {
        return {
          hasAccess: true,
          reason: 'Premium subscription active'
        }
      }

      return {
        hasAccess: false,
        reason: 'Premium subscription required'
      }
    } catch (error) {
      console.error('Error checking topic access:', error)
      return {
        hasAccess: topicId === 1, // Fallback to free tier
        reason: 'Error checking access - defaulting to free tier'
      }
    }
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, subscription_status, subscription_platform, subscription_id, stripe_customer_id')
        .eq('auth_user_id', userId)
        .single()

      if (!userProfile) {
        console.log('User profile not found for subscription check, userId:', userId)
        
        // Return free user status if no profile exists
        if (profileError?.code === 'PGRST116') {
          return {
            id: 'temp',
            userId: userId,
            status: 'free',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
        
        console.error('Error fetching user profile:', profileError)
        return null
      }

      // If no subscription, return free user status
      if (userProfile.subscription_status === 'free' || !userProfile.subscription_id) {
        return {
          id: userProfile.id,
          userId: userId,
          status: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      // Get Stripe subscription details
      if (userProfile.subscription_platform === 'stripe') {
        const { data: stripeSubscription } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .single()

        if (!stripeSubscription) {
          return null
        }

        // Determine plan type from price ID
        let planType: 'monthly' | 'yearly' | undefined
        if (stripeSubscription.stripe_price_id === process.env.STRIPE_YEARLY_PRICE_ID) {
          planType = 'yearly'
        } else if (stripeSubscription.stripe_price_id === process.env.STRIPE_MONTHLY_PRICE_ID) {
          planType = 'monthly'
        }

        return {
          id: stripeSubscription.id,
          userId: userId,
          status: stripeSubscription.status as any,
          planType: planType,
          stripeCustomerId: stripeSubscription.stripe_customer_id,
          stripeSubscriptionId: stripeSubscription.stripe_subscription_id,
          currentPeriodStart: stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start) : undefined,
          currentPeriodEnd: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end) : undefined,
          createdAt: new Date(stripeSubscription.created_at),
          updatedAt: new Date(stripeSubscription.updated_at)
        }
      }

      return null
    } catch (error) {
      console.error('Error getting user subscription:', error)
      return null
    }
  }

  async upsertUserSubscription(userId: string, subscriptionData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          status: subscriptionData.status,
          plan_type: subscriptionData.planType,
          stripe_customer_id: subscriptionData.stripeCustomerId,
          stripe_subscription_id: subscriptionData.stripeSubscriptionId,
          current_period_start: subscriptionData.currentPeriodStart?.toISOString(),
          current_period_end: subscriptionData.currentPeriodEnd?.toISOString(),
          trial_end: subscriptionData.trialEnd?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting subscription:', error)
        return null
      }

      return this.getUserSubscription(userId)
    } catch (error) {
      console.error('Error upserting subscription:', error)
      return null
    }
  }

  async logSubscriptionEvent(userId: string, eventType: string, eventData: any): Promise<void> {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging subscription event:', error)
    }
  }

  async logTopicAccess(userId: string, topicId: number, hasAccess: boolean, userAgent: string): Promise<void> {
    try {
      await supabase
        .from('user_access_log')
        .insert({
          user_id: userId,
          topic_id: topicId,
          access_granted: hasAccess,
          user_agent: userAgent,
          accessed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging topic access:', error)
    }
  }
}

export const simpleSubscriptionService = new SimpleSubscriptionService()