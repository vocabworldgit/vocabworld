#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 VOCO Authentication Setup Helper\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env.example')

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env.local from .env.example...')
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Created .env.local file')
    console.log('📝 Please edit .env.local with your actual credentials\n')
  } else {
    console.log('❌ .env.example not found. Creating basic .env.local...')
    const basicEnv = `# VOCO Authentication Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
`
    fs.writeFileSync(envPath, basicEnv)
    console.log('✅ Created basic .env.local file\n')
  }
} else {
  console.log('✅ .env.local file already exists\n')
}

// Check environment variables
console.log('🔍 Checking environment configuration...\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
]

let missingVars = []

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`❌ ${varName}: Not configured`)
    missingVars.push(varName)
  } else {
    console.log(`✅ ${varName}: Configured`)
  }
})

console.log('\n📋 Setup Status:')
if (missingVars.length === 0) {
  console.log('🎉 All environment variables are configured!')
  console.log('🚀 You can now test authentication at: http://localhost:3000/test-auth')
} else {
  console.log('⚠️  Please configure the following in your .env.local file:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  
  console.log('\n📚 Setup guides:')
  console.log('🗄️  Supabase: https://supabase.com/docs/guides/getting-started')
  console.log('🔐 Google OAuth: https://console.developers.google.com/')
  console.log('📖 Full guide: ./TESTING_GUIDE.md')
}

console.log('\n🧪 Testing commands:')
console.log('Web:     npm run dev (then visit /test-auth)')
console.log('Android: npx cap run android')
console.log('iOS:     npx cap run ios')