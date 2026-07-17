import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  // Simple security check - in production, add proper authentication
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.ADMIN_SECRET_TOKEN

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CLEANUP] Fetching all users...')

    // Get all users
    const { data, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('[CLEANUP] Error listing users:', listError)
      return NextResponse.json({ error: 'Failed to list users', details: listError.message }, { status: 500 })
    }

    const users = data?.users ?? []
    console.log(`[CLEANUP] Found ${users.length} total users`)

    // Filter test emails
    const testEmails = users.filter(
      (user) =>
        user.email?.includes('+teste') ||
        user.email?.includes('teste@') ||
        user.email?.includes('+test') ||
        user.email?.includes('test@')
    )

    console.log(`[CLEANUP] Found ${testEmails.length} test users to delete:`)
    const deletedUsers = []

    // Delete test users
    for (const user of testEmails) {
      console.log(`[CLEANUP] Deleting user: ${user.email}`)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        console.error(`[CLEANUP] Error deleting ${user.email}:`, deleteError)
      } else {
        console.log(`[CLEANUP] ✓ Deleted: ${user.email}`)
        deletedUsers.push(user.email)
      }
    }

    console.log(`[CLEANUP] ✅ Cleanup complete! Deleted ${deletedUsers.length} users`)

    return NextResponse.json({
      success: true,
      deletedCount: deletedUsers.length,
      deletedEmails: deletedUsers,
      totalUsers: users.length,
    })
  } catch (error) {
    console.error('[CLEANUP] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: String(error) },
      { status: 500 }
    )
  }
}
