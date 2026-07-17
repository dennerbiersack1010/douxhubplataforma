import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log('[CLEANUP] Starting cleanup...')
    const { data, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const users = data?.users ?? []
    const testEmails = users.filter(
      (user) =>
        user.email?.includes('+teste') ||
        user.email?.includes('teste@') ||
        user.email?.includes('+test') ||
        user.email?.includes('test@')
    )

    const deletedUsers = []

    for (const user of testEmails) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (!deleteError) {
        deletedUsers.push(user.email)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedUsers.length,
      deletedEmails: deletedUsers,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
