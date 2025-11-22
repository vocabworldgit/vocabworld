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

async function checkAuthUsers() {
  console.log('Checking auth.users...\n')
  
  // Get users from auth.users using admin API
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching auth users:', error)
    return
  }

  console.log(`Found ${users.length} users in auth.users:\n`)
  
  users.forEach(user => {
    console.log(`📧 ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Last sign in: ${user.last_sign_in_at}`)
    console.log('')
  })
}

checkAuthUsers()
