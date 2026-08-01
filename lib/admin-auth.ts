import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { User } from '@supabase/supabase-js'

export function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ??
    process.env.ADMIN_EMAIL ??
    'monicaandreatorres@gmail.com,gen.escudero@gmail.com'
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/** API guard — returns the signed-in admin user or an error response. */
export async function requireAdmin(): Promise<
  | { user: User; admin: ReturnType<typeof createAdminClient>; error?: never }
  | { user?: never; admin?: never; error: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, admin: createAdminClient() }
}
