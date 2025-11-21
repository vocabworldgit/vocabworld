import { SignInWithApple } from '@capacitor-community/apple-sign-in'
import { Capacitor } from '@capacitor/core'

// Apple sign-in for mobile (iOS only)
export async function signInWithAppleMobile() {
  try {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS devices')
    }

    const result = await SignInWithApple.authorize()

    return {
      success: true,
      data: {
        identityToken: result.response.identityToken,
        user: {
          id: result.response.user,
          email: result.response.email || undefined,
          name: result.response.givenName && result.response.familyName ? 
            `${result.response.givenName} ${result.response.familyName}`.trim() 
            : result.response.givenName || undefined
        }
      }
    }
  } catch (error) {
    console.error('Apple mobile sign-in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Apple sign-in failed'
    }
  }
}

// Apple sign-in for web (using Supabase OAuth)
export async function signInWithAppleWeb() {
  // This will be handled by Supabase OAuth redirect
  return {
    success: true,
    data: null // OAuth redirect will handle the rest
  }
}

// Check if Apple Sign-In is available
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      // On iOS, Apple Sign-In is generally available on iOS 13+
      return true
    }
    return false
  } catch (error) {
    console.error('Error checking Apple Sign-In availability:', error)
    return false
  }
}
