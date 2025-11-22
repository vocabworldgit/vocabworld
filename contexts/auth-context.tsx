"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, AuthUser } from '@/lib/auth/auth-service'

// Client-side subscription interface
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

interface AuthContextType {
  user: AuthUser | null
  subscription: UserSubscription | null
  isPremium: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  checkTopicAccess: (topicId: number) => Promise<{ hasAccess: boolean, reason?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!user?.id) {
      setSubscription(null)
      setIsPremium(false)
      return
    }

    try {
      // Get subscription status via API
      const response = await fetch(`/api/subscription/status?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setIsPremium(data.isPremium)

        console.log('📊 User subscription status:', {
          userId: user.id,
          status: data.subscription?.status,
          isPremium: data.isPremium
        })
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const checkTopicAccess = async (topicId: number) => {
    if (!user?.id) {
      return { hasAccess: false, reason: 'Not authenticated' }
    }

    try {
      const response = await fetch('/api/subscription/topic-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, topicId })
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      // Fallback: topic 1 is free
      return {
        hasAccess: topicId === 1,
        reason: topicId === 1 ? undefined : 'Premium subscription required'
      }
    } catch (error) {
      console.error('Error checking topic access:', error)
      return {
        hasAccess: topicId === 1,
        reason: topicId === 1 ? undefined : 'Error checking access'
      }
    }
  }

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle()
  }

  const signInWithApple = async () => {
    await authService.signInWithApple()
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setSubscription(null)
    setIsPremium(false)
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        
        if (mounted) {
          setUser(currentUser)
          setLoading(false)

          if (currentUser) {
            // Get subscription for logged in user via API
            const response = await fetch(`/api/subscription/status?userId=${currentUser.id}`)
            if (response.ok) {
              const data = await response.json()
              setSubscription(data.subscription)
              setIsPremium(data.isPremium)

              console.log('✅ Auth initialized:', {
                email: currentUser.email,
                status: data.subscription?.status,
                isPremium: data.isPremium
              })
            }
            
            // Update login streak
            try {
              await fetch('/api/progress/streak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              console.log('✅ Login streak updated')
            } catch (error) {
              console.error('Failed to update login streak:', error)
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = authService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event)
        
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name || session.user.email!,
            avatarUrl: session.user.user_metadata?.avatar_url,
          }
          
          if (mounted) {
            setUser(authUser)
            
            // Get subscription via API
            const response = await fetch(`/api/subscription/status?userId=${authUser.id}`)
            if (response.ok) {
              const data = await response.json()
              setSubscription(data.subscription)
              setIsPremium(data.isPremium)
            }
          }
        } else if (mounted) {
          setUser(null)
          setSubscription(null)
          setIsPremium(false)
        }
      }
    )

    return () => {
      mounted = false
      authSubscription.unsubscribe()
    }
  }, [])

  // Refresh subscription when user changes
  useEffect(() => {
    if (user) {
      refreshUser()
    }
  }, [user?.id])

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isPremium,
        loading,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshUser,
        checkTopicAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
