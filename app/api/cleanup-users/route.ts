import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[CLEANUP-GET] Starting...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[CLEANUP-GET] URL:', supabaseUrl ? '✓' : '✗')
    console.log('[CLEANUP-GET] Key:', supabaseServiceKey ? '✓' : '✗')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[CLEANUP-GET] Missing credentials')
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('[CLEANUP-GET] Listing users...')
    const { data, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('[CLEANUP-GET] List error:', listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const users = data?.users ?? []
    console.log(`[CLEANUP-GET] Found ${users.length} total users`)
    
    const testEmails = users.filter(
      (user) =>
        user.email?.includes('+teste') ||
        user.email?.includes('teste@') ||
        user.email?.includes('+test') ||
        user.email?.includes('test@')
    )

    console.log(`[CLEANUP-GET] Found ${testEmails.length} test users`)
    const deletedUsers = []

    for (const user of testEmails) {
      console.log(`[CLEANUP-GET] Deleting ${user.email}...`)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (!deleteError) {
        console.log(`[CLEANUP-GET] ✓ Deleted ${user.email}`)
        deletedUsers.push(user.email)
      } else {
        console.error(`[CLEANUP-GET] Error deleting ${user.email}:`, deleteError)
      }
    }

    console.log(`[CLEANUP-GET] ✓ Complete! Deleted ${deletedUsers.length}`)

    return NextResponse.json({
      success: true,
      deletedCount: deletedUsers.length,
      deletedEmails: deletedUsers,
    })
  } catch (error) {
    console.error('[CLEANUP-GET] Exception:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
