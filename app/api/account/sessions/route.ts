import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  formatSessionTime,
  getSessionIdFromAccessToken,
  parseUserAgent,
} from '@/lib/device-sessions'

export const dynamic = 'force-dynamic'

type SessionRow = {
  id: string
  created_at: string
  updated_at: string | null
  refreshed_at: string | null
  user_agent: string | null
  ip: string | null
}

/** GET — list active sessions for the signed-in user (Airbnb device history). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('list_my_sessions')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const currentId = getSessionIdFromAccessToken(session.access_token)
  const rows = (data ?? []) as SessionRow[]

  const devices = rows.map(row => {
    const device = parseUserAgent(row.user_agent)
    const lastActive = row.refreshed_at ?? row.updated_at ?? row.created_at
    return {
      id: row.id,
      title: device.title,
      browser: device.browser,
      os: device.os,
      ip: row.ip,
      lastActive,
      lastActiveLabel: formatSessionTime(lastActive),
      isCurrent: currentId != null && row.id === currentId,
    }
  })

  // If JWT has no session_id, mark the most recently active as current
  if (!devices.some(d => d.isCurrent) && devices.length > 0) {
    devices[0].isCurrent = true
  }

  return NextResponse.json({ devices })
}

/** DELETE — revoke one session, or all others when body.scope === 'others' */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string
    scope?: 'one' | 'others'
  }

  if (body.scope === 'others') {
    const { data, error } = await supabase.rpc('revoke_my_other_sessions')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ revoked: data ?? 0 })
  }

  if (!body.sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  const currentId = getSessionIdFromAccessToken(
    (await supabase.auth.getSession()).data.session?.access_token
  )
  if (currentId && body.sessionId === currentId) {
    return NextResponse.json(
      { error: 'Cannot revoke the current session here. Use sign out instead.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('revoke_my_session', {
    target_session_id: body.sessionId,
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
