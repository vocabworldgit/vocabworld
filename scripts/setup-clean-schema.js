const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupSchema() {
  console.log('📦 Setting up clean subscription schema...\n')
  
  const sql = fs.readFileSync('clean-subscription-schema.sql', 'utf8')
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error('❌ Error:', error)
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/ripkorbuxnoljiprhlyk/sql/new')
    console.log('\nSQL file: clean-subscription-schema.sql')
  } else {
    console.log('✅ Schema created successfully!')
  }
}

setupSchema()
