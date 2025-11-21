"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, AuthUser, UserProfile } from '@/lib/auth/auth-service'
import { clientSubscriptionService, UserSubscription } from '@/lib/subscription/client-subscription-service'

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  subscription: UserSubscription | null
  isPremium: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>
  refreshUser: () => Promise<void>
  refreshSubscription: () => Promise<void>
  checkTopicAccess: (topicId: number) => Promise<boolean>
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

  // Helper to refresh subscription data
  const refreshSubscription = async () => {
    if (!user?.id) {
      setSubscription(null)
      setIsPremium(false)
      return
    }

    try {
      const userSubscription = await clientSubscriptionService.getUserSubscription(user.id)
      const premiumAccess = await clientSubscriptionService.checkUserPremiumAccess(user.id)
      
      setSubscription(userSubscription)
      setIsPremium(premiumAccess)
      
      console.log('📋 SUBSCRIPTION REFRESH:', {
        userId: user.id,
        subscription: userSubscription?.status || 'free',
        isPremium: premiumAccess
      })
    } catch (error) {
      console.error('❌ Error refreshing subscription:', error)
      setSubscription(null)
      setIsPremium(false)
    }
  }

  // Helper to check topic access
  const checkTopicAccess = async (topicId: number): Promise<boolean> => {
    if (!user?.id) {
      return topicId === 1 // Only greetings for unauthenticated users
    }

    try {
      const accessResult = await clientSubscriptionService.checkTopicAccess(user.id, topicId)
      
      // Note: logging is handled by the API endpoint
      return accessResult.hasAccess
    } catch (error) {
      console.error('❌ Error checking topic access:', error)
      return topicId === 1 // Default to greetings only on error
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('📋 AUTH REPORT: Initializing authentication system...')
        // Check if there's an existing session first
        const currentUser = await authService.getCurrentUser()
        if (mounted) {
          if (currentUser) {
            console.log('� AUTH REPORT: Existing user session found')
            console.log('📋 USER PROFILE:', {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.profile?.full_name,
              provider: currentUser.profile?.provider,
              subscription: currentUser.profile?.subscription_status,
              lastSignIn: currentUser.profile?.last_sign_in
            })
            setUser(currentUser)
            
            // Load subscription data for existing user
            const userSubscription = await clientSubscriptionService.getUserSubscription(currentUser.id)
            const premiumAccess = await clientSubscriptionService.checkUserPremiumAccess(currentUser.id)
            setSubscription(userSubscription)
            setIsPremium(premiumAccess)
          } else {
            console.log('📋 AUTH REPORT: No existing user session')
            setUser(null)
            setSubscription(null)
            setIsPremium(false)
          }
        }
      } catch (error) {
        console.error('📋 AUTH REPORT: Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('📋 AUTH REPORT: Authentication initialization complete')
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((authUser) => {
      if (mounted) {
        if (authUser) {
          console.log('� AUTH REPORT: ✅ USER LOGGED IN')
          console.log('📋 LOGIN DETAILS:', {
            timestamp: new Date().toISOString(),
            userId: authUser.id,
            email: authUser.email,
            provider: authUser.profile?.provider || 'unknown',
            isNewUser: !authUser.profile,
            subscriptionStatus: authUser.profile?.subscription_status || 'free'
          })
          if (!authUser.profile) {
            console.log('📋 AUTH REPORT: 🆕 NEW USER - Profile will be created')
          }
          
          // Load subscription data for logged in user
          refreshSubscription()
        } else {
          console.log('📋 AUTH REPORT: ❌ USER LOGGED OUT')
          console.log('📋 LOGOUT DETAILS:', {
            timestamp: new Date().toISOString(),
            reason: 'Session ended or user signed out'
          })
          setSubscription(null)
          setIsPremium(false)
        }
        setUser(authUser)
        setLoading(false)
      }
    })

    // Check for OAuth callback completion
    const checkForOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('code') || window.location.pathname === '/auth/callback') {
        console.log('📋 AUTH REPORT: � OAuth callback detected, processing...')
        // Delay to allow session to be established
        setTimeout(async () => {
          try {
            const currentUser = await authService.getCurrentUser()
            if (mounted && currentUser) {
              console.log('� AUTH REPORT: ✅ OAuth callback successful')
              setUser(currentUser)
            } else {
              console.log('📋 AUTH REPORT: ⚠️ OAuth callback completed but no user found')
            }
          } catch (error) {
            console.error('📋 AUTH REPORT: ❌ Error after OAuth callback:', error)
          }
        }, 1000)
      }
    }

    checkForOAuthCallback()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      console.log('� AUTH REPORT: 🚀 Starting Google sign-in process...')
      setLoading(true)
      const result = await authService.signInWithGoogle()
      
      console.log('� AUTH REPORT: Google sign-in result received')
      
      if (result.error) {
        console.error('� AUTH REPORT: ❌ Google sign-in failed:', result.error)
        setLoading(false) // Reset loading on error
        // You might want to show a toast or error message here
      } else if (result.user) {
        console.log('� AUTH REPORT: ✅ Google sign-in successful (direct)')
        setUser(result.user)
        setLoading(false) // Reset loading when user is set
      } else {
        console.log('📋 AUTH REPORT: � Google OAuth redirect initiated')
        // For OAuth flows, don't reset loading here as the auth state change listener will handle it
        // The user will be set via the auth state change listener after redirect
      }
    } catch (error) {
      console.error('� AUTH REPORT: ❌ Google sign-in exception:', error)
      setLoading(false) // Reset loading on error
    }
  }

  const signInWithApple = async () => {
    try {
      setLoading(true)
      const result = await authService.signInWithApple()
      
      if (result.error) {
        console.error('Apple sign-in error:', result.error)
        setLoading(false) // Reset loading on error
        // You might want to show a toast or error message here
      } else if (result.user) {
        setUser(result.user)
        setLoading(false) // Reset loading when user is set
      } else {
        // For OAuth flows, don't reset loading here as the auth state change listener will handle it
        // The user will be set via the auth state change listener after redirect
      }
    } catch (error) {
      console.error('Apple sign-in error:', error)
      setLoading(false) // Reset loading on error
    }
  }

  const signOut = async () => {
    try {
      console.log('📋 AUTH REPORT: 🚪 User initiated sign-out...')
      setLoading(true)
      
      // Clear user state immediately to prevent UI issues
      setUser(null)
      setSubscription(null)
      setIsPremium(false)
      
      const { error } = await authService.signOut()
      if (error) {
        console.error('📋 AUTH REPORT: ❌ Sign out error:', error)
      } else {
        console.log('📋 AUTH REPORT: ✅ Sign out successful')
      }
      
      // Clear welcome screen skip flag so user sees welcome again
      localStorage.removeItem('welcome-skipped')
      
      // Force a page refresh to ensure clean state
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }, 100)
      
    } catch (error) {
      console.error('📋 AUTH REPORT: ❌ Sign out exception:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      console.log('📋 AUTH REPORT: 🔄 Updating user profile...')
      const updatedProfile = await authService.updateProfile(updates)
      if (updatedProfile && user) {
        console.log('📋 SUBSCRIPTION REPORT: ✅ Profile updated successfully')
        if (updates.subscription_status) {
          console.log('📋 SUBSCRIPTION REPORT: 💳 Subscription status changed:', {
            from: user.profile?.subscription_status || 'unknown',
            to: updates.subscription_status,
            timestamp: new Date().toISOString(),
            userId: user.id
          })
        }
        setUser({
          ...user,
          profile: updatedProfile
        })
      }
      return updatedProfile
    } catch (error) {
      console.error('📋 AUTH REPORT: ❌ Update profile error:', error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    profile: user?.profile || null,
    subscription,
    isPremium,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateProfile,
    refreshUser,
    refreshSubscription,
    checkTopicAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access this feature.
            </p>
            {/* You can add sign-in buttons here */}
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

export default AuthProvider