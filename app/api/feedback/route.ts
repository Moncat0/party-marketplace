import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length < 3) {
    return NextResponse.json({ error: 'Skriv lite mer feedback.' }, { status: 400 })
  }

  const { data: row } = await supabase.from('users').select('name, email').eq('id', user.id).maybeSingle()

  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'FESTEN. <onboarding@resend.dev>',
        to: process.env.FEEDBACK_EMAIL ?? 'delivered@resend.dev',
        subject: 'Feedback om meddelanden — FESTEN.',
        text: `Från: ${row?.name ?? 'Okänd'} <${row?.email ?? user.email}>\n\n${message}`,
      })
    }
  } catch {
    // still accept
  }

  return NextResponse.json({ ok: true })
}
