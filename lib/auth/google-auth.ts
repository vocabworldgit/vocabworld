import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { Capacitor } from '@capacitor/core'

// Initialize Google Auth
export async function initializeGoogleAuth() {
  if (Capacitor.isNativePlatform()) {
    await GoogleAuth.initialize({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    })
  }
}

// Google sign-in for mobile
export async function signInWithGoogleMobile() {
  try {
    const result = await GoogleAuth.signIn()
    
    return {
      success: true,
      data: {
        accessToken: result.authentication.accessToken,
        idToken: result.authentication.idToken,
        user: {
          id: result.authentication.idToken, // Will extract from ID token
          email: result.email,
          name: result.name,
          imageUrl: result.imageUrl
        }
      }
    }
  } catch (error) {
    console.error('Google mobile sign-in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google sign-in failed'
    }
  }
}

// Google sign-in for web (using Supabase OAuth)
export async function signInWithGoogleWeb() {
  // This will be handled by Supabase OAuth redirect
  return {
    success: true,
    data: null // OAuth redirect will handle the rest
  }
}

// Sign out from Google
export async function signOutFromGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleAuth.signOut()
    } catch (error) {
      console.error('Google sign-out error:', error)
    }
  }
}
