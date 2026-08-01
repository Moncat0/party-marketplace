import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { sendAdminSupportMessage } from '@/lib/resend'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

/** POST — email the user from FESTEN support (admin chat proxy). */
export async function POST(request: Request, { params }: Params) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { admin, user: adminUser } = gate

  let body: { subject?: string; message?: string }
  try {
    body = (await request.json()) as { subject?: string; message?: string }
  } catch {
    return NextResponse.json({ error: 'Ogiltig JSON' }, { status: 400 })
  }

  const subject = (body.subject ?? '').trim()
  const message = (body.message ?? '').trim()
  if (!subject || !message) {
    return NextResponse.json(
      { error: 'Ämne och meddelande krävs.' },
      { status: 400 }
    )
  }

  const { data: target, error } = await admin
    .from('users')
    .select('id, email, name, first_name, preferred_first_name')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !target?.email) {
    return NextResponse.json({ error: 'Användaren hittades inte.' }, { status: 404 })
  }

  const name =
    target.preferred_first_name ||
    target.first_name ||
    target.name ||
    target.email

  try {
    await sendAdminSupportMessage(
      target.email,
      name,
      subject,
      message,
      adminUser.email
    )
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Kunde inte skicka e-post',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
