// Client-side subscription service that calls API endpoints
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

class ClientSubscriptionService {
  async checkUserPremiumAccess(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/subscription/premium-check?userId=${encodeURIComponent(userId)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check premium access')
      }
      
      return data.isPremium
    } catch (error) {
      console.error('Error checking premium access:', error)
      return false
    }
  }

  async checkTopicAccess(userId: string, topicId: number): Promise<AccessResult> {
    try {
      const response = await fetch('/api/subscription/topic-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, topicId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check topic access')
      }
      
      return data
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
      const response = await fetch(`/api/subscription/get-subscription?userId=${encodeURIComponent(userId)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get subscription')
      }
      
      return data.subscription
    } catch (error) {
      console.error('Error getting user subscription:', error)
      return null
    }
  }

  async refreshSubscription(): Promise<void> {
    // This method can be used to trigger a refresh
    // The actual refresh happens when the individual methods are called
    console.log('Subscription data will be refreshed on next access')
  }
}

export const clientSubscriptionService = new ClientSubscriptionService()