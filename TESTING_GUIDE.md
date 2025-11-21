# 🧪 Authentication Testing Guide

This guide will help you test the Google & Apple authentication system across different platforms.

## 🚀 Quick Start Testing

### 1. Access the Test Page
Visit: `http://localhost:3000/test-auth` (after starting your dev server)

### 2. Environment Setup
First, create your `.env.local` file with the required credentials:

```bash
# Copy the template
cp .env.example .env.local
```

Then fill in your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🌐 Web Testing (Development)

### Prerequisites:
1. **Supabase Project Setup**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL from `auth-schema.sql` in your Supabase SQL editor
   - Get your URL and anon key from Settings > API

2. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create/select a project
   - Enable Google Sign-In API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` and your Supabase callback URL to authorized origins

### Testing Steps:
```bash
# 1. Start development server
npm run dev

# 2. Visit test page
open http://localhost:3000/test-auth

# 3. Test Google Sign-In (Web OAuth)
# Click "Continue with Google" button
# Should redirect to Google, then back to your app

# 4. Test Apple Sign-In (Web OAuth) 
# Click "Continue with Apple" button
# Should redirect to Apple, then back to your app
```

## 📱 Mobile Testing (Android)

### Prerequisites:
1. **Android Studio Setup**
   - Install Android Studio
   - Set up an Android Virtual Device (AVD) or connect physical device

2. **Google OAuth for Android**
   - In Google Cloud Console, create Android OAuth credentials
   - Use SHA-1 fingerprint from your debug keystore
   - Add to your Google OAuth client

### Testing Steps:
```bash
# 1. Build and sync Capacitor
npx cap sync android

# 2. Open in Android Studio
npx cap open android

# 3. Or run directly
npx cap run android

# 4. Test native Google authentication
# Should use native Google Sign-In SDK
```

### Debug Android Issues:
```bash
# Check logs
npx cap run android --list

# View detailed logs
adb logcat | grep -i capacitor
```

## 🍎 iOS Testing

### Prerequisites:
1. **Xcode Setup**
   - Install Xcode (Mac required)
   - iOS Simulator or physical device

2. **Apple Sign-In Setup**
   - Configure in Apple Developer Console
   - Enable Sign in with Apple capability

### Testing Steps:
```bash
# 1. Build and sync Capacitor
npx cap sync ios

# 2. Open in Xcode
npx cap open ios

# 3. Configure capabilities in Xcode:
# - Sign in with Apple
# - Associated Domains (if needed)

# 4. Run on simulator/device
# Test Apple Sign-In (should use native flow)
```

## 🔧 Testing Features

### Authentication Flow Testing:
1. **Sign In** - Test both Google & Apple
2. **Profile Creation** - Verify user profile is created in database
3. **Sign Out** - Test sign out functionality
4. **Return User** - Test returning user flow

### Profile Management Testing:
1. **View Profile** - Check user data display
2. **Edit Profile** - Test profile updates
3. **Learning Languages** - Test language selection
4. **Subscription Status** - Verify subscription fields

### Database Testing:
1. **User Profiles Table** - Check data in Supabase dashboard
2. **RLS Policies** - Verify users can only see their own data
3. **Triggers** - Test automatic profile creation

## 🐛 Common Issues & Solutions

### Web Testing Issues:

**"OAuth Error: Invalid redirect URI"**
```bash
# Solution: Add these URLs to your Google OAuth settings:
http://localhost:3000
https://your-project.supabase.co/auth/v1/callback
```

**"Supabase client error"**
```bash
# Check your environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Mobile Testing Issues:

**"Google Sign-In failed on Android"**
```bash
# 1. Check SHA-1 fingerprint
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey

# 2. Add fingerprint to Google Cloud Console
# 3. Rebuild app
npx cap sync android
```

**"Apple Sign-In not available"**
```bash
# iOS Simulator: Apple Sign-In may not work in simulator
# Use physical iOS device for testing
```

## 📊 Testing Checklist

### Basic Authentication:
- [ ] Google sign-in works on web
- [ ] Apple sign-in works on web  
- [ ] Google sign-in works on Android
- [ ] Apple sign-in works on iOS
- [ ] User profile created in database
- [ ] OAuth redirects work correctly

### Profile Management:
- [ ] Profile data displays correctly
- [ ] Profile editing works
- [ ] Learning languages can be updated
- [ ] Changes persist in database

### Error Handling:
- [ ] Network errors handled gracefully
- [ ] OAuth errors show proper messages
- [ ] Invalid credentials handled
- [ ] Sign out works correctly

### Platform Detection:
- [ ] Correct authentication method chosen per platform
- [ ] Mobile vs web flows work as expected
- [ ] Capacitor plugins load correctly

## 🎯 Advanced Testing

### Load Testing:
```bash
# Test multiple sign-ins rapidly
# Check for race conditions
# Verify session management
```

### Security Testing:
```bash
# Test RLS policies in Supabase
# Verify JWT tokens
# Check CORS settings
```

### Performance Testing:
```bash
# Measure sign-in speed
# Check bundle size impact
# Test offline behavior
```

## 📝 Test Results

Document your testing results:

| Platform | Google Auth | Apple Auth | Profile Mgmt | Issues |
|----------|-------------|------------|--------------|--------|
| Web      | ✅/❌       | ✅/❌       | ✅/❌         |        |
| Android  | ✅/❌       | N/A        | ✅/❌         |        |
| iOS      | ✅/❌       | ✅/❌       | ✅/❌         |        |

---

**🎉 Ready to test!** Start with the web testing and then move to mobile platforms.