'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { rememberAccount } from '@/lib/remembered-accounts'

/**
 * Keeps localStorage "Welcome back" accounts in sync after OAuth / email
 * confirmation redirects (where AuthPanel never runs rememberAccount).
 */
export default function RememberAccountSync() {
  useEffect(() => {
    const supabase = createClient()

    async function syncFromUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) return
      rememberAccount({
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      })
    }

    void syncFromUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') {
        return
      }
      const user = session?.user
      if (!user?.email) return
      rememberAccount({
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
