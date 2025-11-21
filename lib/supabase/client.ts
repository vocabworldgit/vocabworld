import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Types for our database
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          auth_user_id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          provider: 'google' | 'apple' | 'email'
          provider_id: string | null
          created_at: string
          updated_at: string
          last_sign_in: string
          preferred_language: string
          learning_languages: string[]
          subscription_status: 'free' | 'premium' | 'trial'
          subscription_platform: 'stripe' | 'apple' | null
          subscription_id: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider: 'google' | 'apple' | 'email'
          provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_sign_in?: string
          preferred_language?: string
          learning_languages?: string[]
          subscription_status?: 'free' | 'premium' | 'trial'
          subscription_platform?: 'stripe' | 'apple' | null
          subscription_id?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider?: 'google' | 'apple' | 'email'
          provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_sign_in?: string
          preferred_language?: string
          learning_languages?: string[]
          subscription_status?: 'free' | 'premium' | 'trial'
          subscription_platform?: 'stripe' | 'apple' | null
          subscription_id?: string | null
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          platform: 'stripe' | 'apple'
          external_id: string
          product_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'stripe' | 'apple'
          external_id: string
          product_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'stripe' | 'apple'
          external_id?: string
          product_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          topic_id: number
          language_pair: string
          words_learned: number
          words_practiced: number
          correct_answers: number
          total_attempts: number
          streak_count: number
          best_streak: number
          total_study_time_minutes: number
          last_studied: string | null
          current_difficulty: 'beginner' | 'intermediate' | 'advanced'
          mastery_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: number
          language_pair: string
          words_learned?: number
          words_practiced?: number
          correct_answers?: number
          total_attempts?: number
          streak_count?: number
          best_streak?: number
          total_study_time_minutes?: number
          last_studied?: string | null
          current_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          mastery_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: number
          language_pair?: string
          words_learned?: number
          words_practiced?: number
          correct_answers?: number
          total_attempts?: number
          streak_count?: number
          best_streak?: number
          total_study_time_minutes?: number
          last_studied?: string | null
          current_difficulty?: 'beginner' | 'intermediate' | 'advanced'
          mastery_level?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Create Supabase client for client-side usage
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Create Supabase client for server-side usage
export const createSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export default createSupabaseClient