const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function enablePremiumFeatures(email) {
  // Get user from auth.users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching users:', authError)
    return
  }

  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.error('User not found:', email)
    return
  }

  console.log(`Enabling premium features for ${email}...`)

  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({ premium_features_enabled: true })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('✅ Premium features enabled!')
  console.log(data)
}

const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/enable-premium.js <email>')
  process.exit(1)
}

enablePremiumFeatures(email)
