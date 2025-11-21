// Quick configuration check for OAuth setup
// Run this in your browser console on localhost:3002

console.log('🔍 OAuth Configuration Check');
console.log('============================');

// Check current URL
console.log('Current URL:', window.location.origin);
console.log('Expected Google Origin:', 'http://localhost:3002');
console.log('Expected Redirect URI:', 'http://localhost:3002/auth/callback');

// Check environment variables (client-side only)
console.log('\n📝 Environment Check:');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found');
console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not found');

// Check if running on correct port
const currentPort = window.location.port;
console.log('\n🌐 Port Check:');
console.log('Current port:', currentPort);
console.log('Expected port:', '3002');
console.log('Port match:', currentPort === '3002' ? '✅' : '❌');

// Instructions
console.log('\n📋 Next Steps:');
console.log('1. Add to Google OAuth Authorized JavaScript Origins:');
console.log('   http://localhost:3002');
console.log('2. Add to Google OAuth Authorized Redirect URIs:');
console.log('   http://localhost:3002/auth/callback');
console.log('   https://ripkorbuxnoljiprhlyk.supabase.co/auth/v1/callback');
console.log('3. Set Supabase Site URL to: http://localhost:3002');
console.log('4. Add to Supabase Redirect URLs: http://localhost:3002/**');

// Test OAuth readiness
console.log('\n🧪 OAuth Readiness:');
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  console.log('Supabase configured:', supabaseUrl ? '✅' : '❌');
  console.log('Google Client ID configured:', googleClientId ? '✅' : '❌');
  
  if (supabaseUrl && googleClientId) {
    console.log('🎉 Basic configuration looks good!');
    console.log('   Now configure the URLs in Google Console and Supabase Dashboard');
  } else {
    console.log('❌ Missing environment variables');
  }
} catch (error) {
  console.log('❌ Configuration check failed:', error.message);
}