import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// User profile management
export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: 'google' | 'apple' | 'email';
  provider_id: string | null;
  preferred_language: string;
  learning_languages: string[];
  subscription_status: 'free' | 'premium' | 'trial';
  subscription_platform: 'stripe' | 'apple' | null;
  subscription_id: string | null;
  stripe_customer_id: string | null;
  apple_receipt_id: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in: string;
}

export interface SubscriptionData {
  platform: 'stripe' | 'apple';
  subscriptionId: string;
  customerId?: string; // For Stripe
  receiptId?: string; // For Apple
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
}

const supabase = createClientComponentClient()

export async function linkStripeToUser(userId: string, stripeCustomerId: string, subscriptionId?: string) {
  try {
    const updates: Partial<UserProfile> = {
      stripe_customer_id: stripeCustomerId,
      subscription_platform: 'stripe',
      updated_at: new Date().toISOString()
    }

    if (subscriptionId) {
      updates.subscription_id = subscriptionId
      updates.subscription_status = 'premium'
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error linking Stripe to user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in linkStripeToUser:', error)
    return null
  }
}

export async function linkAppleReceiptToUser(userId: string, appleReceiptId: string, subscriptionId?: string) {
  try {
    const updates: Partial<UserProfile> = {
      apple_receipt_id: appleReceiptId,
      subscription_platform: 'apple',
      updated_at: new Date().toISOString()
    }

    if (subscriptionId) {
      updates.subscription_id = subscriptionId
      updates.subscription_status = 'premium'
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error linking Apple receipt to user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in linkAppleReceiptToUser:', error)
    return null
  }
}

export async function updateSubscriptionStatus(userId: string, status: 'free' | 'premium' | 'trial') {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription status:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function updateLearningLanguages(userId: string, languages: string[]) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        learning_languages: languages,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating learning languages:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateLearningLanguages:', error)
    return null
  }
}
