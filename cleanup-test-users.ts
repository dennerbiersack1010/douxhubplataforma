import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function cleanupTestUsers() {
  try {
    console.log('Fetching all users...')

    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    console.log(`Found ${users.users.length} users`)

    // Filter test emails
    const testEmails = users.users.filter(
      (user) =>
        user.email?.includes('+teste') ||
        user.email?.includes('teste') ||
        user.email?.includes('test')
    )

    console.log(`Found ${testEmails.length} test users to delete:`)
    testEmails.forEach((user) => console.log(`  - ${user.email}`))

    // Delete test users
    for (const user of testEmails) {
      console.log(`Deleting user: ${user.email}`)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        console.error(`Error deleting ${user.email}:`, deleteError)
      } else {
        console.log(`✓ Deleted: ${user.email}`)
      }
    }

    console.log('\n✅ Cleanup complete!')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

cleanupTestUsers()
