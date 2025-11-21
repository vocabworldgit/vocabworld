import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Types for subscription system
export interface UserSubscription {
  id: string
  user_id: string
  status: 'free' | 'active' | 'past_due' | 'canceled' | 'expired'
  plan_type: 'monthly' | 'yearly' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  apple_original_transaction_id: string | null
  apple_subscription_group_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_end: string | null
  price_paid: number | null
  currency: string
  premium_features_enabled: boolean
  auto_renewal_enabled: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionEvent {
  id: string
  user_id: string
  subscription_id: string | null
  event_type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 
             'payment_succeeded' | 'payment_failed' | 'trial_started' | 'trial_ended' |
             'access_granted' | 'access_revoked' | 'subscription_expired'
  event_source: 'stripe' | 'apple' | 'manual' | 'system'
  stripe_event_id: string | null
  apple_notification_type: string | null
  event_data: any
  created_at: string
}

export interface TopicAccessRule {
  id: number
  topic_id: number
  access_level: 'free' | 'premium'
  created_at: string
  updated_at: string
}

export interface AccessCheckResult {
  hasAccess: boolean
  subscriptionStatus: 'free' | 'active' | 'past_due' | 'canceled' | 'expired'
  requiresUpgrade: boolean
  topicAccessLevel: 'free' | 'premium'
}

class SubscriptionService {
  private supabase = createClientComponentClient()

  // Check if user has premium access
  async checkUserPremiumAccess(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking premium access for user:', userId)
      
      const { data, error } = await this.supabase
        .rpc('check_user_premium_access', { user_uuid: userId })
      
      if (error) {
        console.error('❌ Error checking premium access:', error)
        return false
      }
      
      console.log('✅ Premium access result:', data)
      return data === true
    } catch (error) {
      console.error('❌ Exception checking premium access:', error)
      return false
    }
  }

  // Check if user can access specific topic
  async checkTopicAccess(userId: string, topicId: number): Promise<AccessCheckResult> {
    try {
      console.log('🔍 Checking topic access for user:', userId, 'topic:', topicId)
      
      // Check topic access using database function
      const { data: hasAccess, error: accessError } = await this.supabase
        .rpc('check_topic_access', { user_uuid: userId, topic_id_param: topicId })
      
      if (accessError) {
        console.error('❌ Error checking topic access:', accessError)
        return {
          hasAccess: false,
          subscriptionStatus: 'free',
          requiresUpgrade: true,
          topicAccessLevel: 'premium'
        }
      }

      // Get user's subscription status
      const { data: subscription, error: subError } = await this.supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', userId)
        .single()

      const subscriptionStatus = subError ? 'free' : (subscription?.status || 'free')

      // Get topic access level
      const { data: topicRule, error: ruleError } = await this.supabase
        .from('topic_access_rules')
        .select('access_level')
        .eq('topic_id', topicId)
        .single()

      const topicAccessLevel = ruleError ? 'premium' : (topicRule?.access_level || 'premium')

      const result: AccessCheckResult = {
        hasAccess: hasAccess === true,
        subscriptionStatus: subscriptionStatus as any,
        requiresUpgrade: hasAccess !== true && topicAccessLevel === 'premium',
        topicAccessLevel: topicAccessLevel as 'free' | 'premium'
      }

      console.log('✅ Topic access result:', result)
      return result
    } catch (error) {
      console.error('❌ Exception checking topic access:', error)
      return {
        hasAccess: false,
        subscriptionStatus: 'free',
        requiresUpgrade: true,
        topicAccessLevel: 'premium'
      }
    }
  }

  // Log topic access attempt
  async logTopicAccess(
    userId: string,
    topicId: number,
    accessGranted: boolean,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('log_topic_access', {
          user_uuid: userId,
          topic_id_param: topicId,
          access_granted_param: accessGranted,
          user_agent_param: userAgent || null,
          ip_address_param: ipAddress || null
        })

      if (error) {
        console.error('❌ Error logging topic access:', error)
      } else {
        console.log('✅ Topic access logged:', { userId, topicId, accessGranted })
      }
    } catch (error) {
      console.error('❌ Exception logging topic access:', error)
    }
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found - user is on free tier
          return null
        }
        console.error('❌ Error getting user subscription:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Exception getting user subscription:', error)
      return null
    }
  }

  // Create or update user subscription
  async upsertUserSubscription(subscription: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .upsert(subscription, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error upserting user subscription:', error)
        return null
      }

      console.log('✅ Subscription upserted:', data)
      return data
    } catch (error) {
      console.error('❌ Exception upserting user subscription:', error)
      return null
    }
  }

  // Log subscription event
  async logSubscriptionEvent(
    userId: string,
    eventType: SubscriptionEvent['event_type'],
    eventSource: SubscriptionEvent['event_source'],
    eventData?: any,
    subscriptionId?: string,
    stripeEventId?: string,
    appleNotificationType?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          subscription_id: subscriptionId || null,
          event_type: eventType,
          event_source: eventSource,
          stripe_event_id: stripeEventId || null,
          apple_notification_type: appleNotificationType || null,
          event_data: eventData || null
        })

      if (error) {
        console.error('❌ Error logging subscription event:', error)
      } else {
        console.log('✅ Subscription event logged:', { userId, eventType, eventSource })
      }
    } catch (error) {
      console.error('❌ Exception logging subscription event:', error)
    }
  }

  // Get all topic access rules
  async getTopicAccessRules(): Promise<TopicAccessRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('topic_access_rules')
        .select('*')
        .order('topic_id')

      if (error) {
        console.error('❌ Error getting topic access rules:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception getting topic access rules:', error)
      return []
    }
  }

  // Get free topics list
  async getFreeTopics(): Promise<number[]> {
    try {
      const { data, error } = await this.supabase
        .from('topic_access_rules')
        .select('topic_id')
        .eq('access_level', 'free')

      if (error) {
        console.error('❌ Error getting free topics:', error)
        return [1] // Default to greetings only
      }

      return data?.map(rule => rule.topic_id) || [1]
    } catch (error) {
      console.error('❌ Exception getting free topics:', error)
      return [1] // Default to greetings only
    }
  }

  // Check if user's subscription has expired
  async checkSubscriptionExpiry(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId)
      
      if (!subscription || subscription.status === 'free') {
        return false // Free users don't have expiry
      }

      if (subscription.current_period_end) {
        const expiryDate = new Date(subscription.current_period_end)
        const now = new Date()
        
        if (now > expiryDate && subscription.status === 'active') {
          // Subscription has expired, update status
          await this.upsertUserSubscription({
            ...subscription,
            status: 'expired',
            premium_features_enabled: false
          })

          // Log expiry event
          await this.logSubscriptionEvent(
            userId,
            'subscription_expired',
            'system',
            { expired_at: now.toISOString() },
            subscription.id
          )

          return true
        }
      }

      return false
    } catch (error) {
      console.error('❌ Exception checking subscription expiry:', error)
      return false
    }
  }

  // Grant premium access to user
  async grantPremiumAccess(
    userId: string,
    planType: 'monthly' | 'yearly',
    periodStart: Date,
    periodEnd: Date,
    pricePaid: number,
    currency: string = 'USD',
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<UserSubscription | null> {
    try {
      const subscription: Partial<UserSubscription> = {
        user_id: userId,
        status: 'active',
        plan_type: planType,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price_paid: pricePaid,
        currency: currency,
        premium_features_enabled: true,
        auto_renewal_enabled: true
      }

      const result = await this.upsertUserSubscription(subscription)

      if (result) {
        // Log access granted event
        await this.logSubscriptionEvent(
          userId,
          'access_granted',
          'stripe',
          {
            plan_type: planType,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            price_paid: pricePaid
          },
          result.id
        )
      }

      return result
    } catch (error) {
      console.error('❌ Exception granting premium access:', error)
      return null
    }
  }

  // Revoke premium access
  async revokePremiumAccess(userId: string, reason: string = 'manual'): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId)
      
      if (!subscription) {
        return true // Already no subscription
      }

      const updatedSubscription = await this.upsertUserSubscription({
        ...subscription,
        status: 'canceled',
        premium_features_enabled: false,
        auto_renewal_enabled: false
      })

      if (updatedSubscription) {
        // Log access revoked event
        await this.logSubscriptionEvent(
          userId,
          'access_revoked',
          'manual',
          { reason },
          subscription.id
        )
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Exception revoking premium access:', error)
      return false
    }
  }
}

export const subscriptionService = new SubscriptionService()
export default subscriptionService