// Subscription plans configuration for VocabWorld

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  interval: 'month' | 'year'
  intervalCount: number
  trialDays?: number
  features: string[]
  isPopular?: boolean
  savings?: string
  stripePriceId?: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'yearly',
    name: 'Yearly',
    description: '7-day free trial',
    price: 29.00,
    originalPrice: 59.88, // 12 months × $4.99
    currency: 'USD',
    interval: 'year',
    intervalCount: 1,
    trialDays: 7,
    features: [
      'Access to all vocabulary topics',
      'Daily reminder notifications',
      'Progress tracking and statistics', 
      'Unlimited practice sessions',
      'Offline access to content'
    ],
    isPopular: true,
    savings: '52% off',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID
  },
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'No free trial',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    features: [
      'Access to all vocabulary topics',
      'Daily reminder notifications',
      'Progress tracking and statistics',
      'Unlimited practice sessions', 
      'Offline access to content'
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
  }
]

// Helper functions
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId)
}

export function getMonthlyPrice(plan: SubscriptionPlan): number {
  if (plan.interval === 'month') {
    return plan.price
  }
  if (plan.interval === 'year') {
    return plan.price / 12
  }
  return plan.price
}

export function calculateSavings(yearlyPlan: SubscriptionPlan, monthlyPlan: SubscriptionPlan): number {
  const monthlyAnnualCost = monthlyPlan.price * 12
  const yearlyCost = yearlyPlan.price
  return monthlyAnnualCost - yearlyCost
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(price)
}

export function getPlanDisplayInfo(planId: string) {
  const plan = getPlanById(planId)
  if (!plan) return null

  const monthlyEquivalent = getMonthlyPrice(plan)
  
  return {
    ...plan,
    monthlyEquivalent,
    formattedPrice: formatPrice(plan.price, plan.currency),
    formattedMonthlyEquivalent: formatPrice(monthlyEquivalent, plan.currency),
    isYearly: plan.interval === 'year'
  }
}

// Free tier configuration
export const FREE_TIER_CONFIG = {
  name: 'Free',
  description: 'Limited access to vocabulary topics',
  allowedTopics: [1], // Only Greetings topic
  features: [
    'Access to Greetings topic',
    'Basic vocabulary practice',
    'Limited audio playback'
  ]
}

// Plan comparison helper
export function comparePlans() {
  const monthly = getPlanById('monthly')!
  const yearly = getPlanById('yearly')!
  
  const savings = calculateSavings(yearly, monthly)
  const savingsPercentage = Math.round((savings / (monthly.price * 12)) * 100)
  
  return {
    monthly: getPlanDisplayInfo('monthly')!,
    yearly: getPlanDisplayInfo('yearly')!,
    savings: {
      amount: savings,
      percentage: savingsPercentage,
      formatted: formatPrice(savings)
    }
  }
}