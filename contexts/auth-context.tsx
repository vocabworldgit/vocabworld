"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, AuthUser, UserProfile } from '@/lib/auth/auth-service'
import { subscriptionService, UserSubscription } from '@/lib/subscription/clean-subscription-service'

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
      // Get subscription status
      const sub = await subscriptionService.getUserSubscription(user.id)
      setSubscription(sub)

      // Check if premium
      const premium = await subscriptionService.isPremium(user.id)
      setIsPremium(premium)

      console.log('📊 User subscription status:', {
        userId: user.id,
        status: sub?.status,
        isPremium: premium
      })
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const checkTopicAccess = async (topicId: number) => {
    if (!user?.id) {
      return { hasAccess: false, reason: 'Not authenticated' }
    }

    return await subscriptionService.checkTopicAccess(user.id, topicId)
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
            // Get subscription for logged in user
            const sub = await subscriptionService.getUserSubscription(currentUser.id)
            const premium = await subscriptionService.isPremium(currentUser.id)
            
            setSubscription(sub)
            setIsPremium(premium)

            console.log('✅ Auth initialized:', {
              email: currentUser.email,
              status: sub?.status,
              isPremium: premium
            })
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
            
            // Get subscription
            const sub = await subscriptionService.getUserSubscription(authUser.id)
            const premium = await subscriptionService.isPremium(authUser.id)
            
            setSubscription(sub)
            setIsPremium(premium)
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
