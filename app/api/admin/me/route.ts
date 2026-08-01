import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** Whether the signed-in user is on the admin allowlist (for menu UI). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return NextResponse.json({
    isAdmin: !!user && isAdminEmail(user.email),
  })
}
