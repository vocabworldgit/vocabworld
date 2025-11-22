const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...\n')
  
  // Check if user_subscriptions table exists
  const { data: tables, error: tablesError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .limit(0)
  
  if (tablesError) {
    console.log('❌ user_subscriptions table does NOT exist')
    console.log('Error:', tablesError.message)
    console.log('\n⚠️  You need to run clean-subscription-schema.sql in Supabase SQL Editor')
    return
  }
  
  console.log('✅ user_subscriptions table exists')
  
  // Check for any existing subscriptions
  const { data: subs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select('*')
  
  if (subsError) {
    console.log('❌ Error querying subscriptions:', subsError.message)
    return
  }
  
  console.log(`\n📊 Found ${subs.length} subscriptions:`)
  subs.forEach(sub => {
    console.log(`  - User: ${sub.user_id}, Status: ${sub.status}`)
  })
  
  // Check if old user_profiles table still exists
  const { error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(0)
  
  if (profilesError) {
    console.log('\n✅ user_profiles table removed (good!)')
  } else {
    console.log('\n⚠️  user_profiles table still exists - old trigger might still be active')
  }
}

checkSchema().catch(console.error)
