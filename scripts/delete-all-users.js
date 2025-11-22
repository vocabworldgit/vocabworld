const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function deleteAllUsers() {
  console.log('🗑️  Deleting all users...\n')
  
  // Get all users from auth.users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log(`Found ${users.length} users to delete\n`)
  
  for (const user of users) {
    console.log(`Deleting ${user.email} (${user.id})...`)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error(`  ❌ Error: ${deleteError.message}`)
    } else {
      console.log(`  ✅ Deleted`)
    }
  }

  console.log('\n✅ All users deleted!')
  console.log('\nNote: user_profiles and user_subscriptions will be automatically cleaned up by CASCADE delete.')
}

deleteAllUsers()
