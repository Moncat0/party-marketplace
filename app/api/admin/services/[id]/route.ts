import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function PATCH(request: Request, { params }: Params) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await request.json().catch(() => ({}))
  if (typeof body.is_disabled !== 'boolean') {
    return NextResponse.json({ error: 'is_disabled (boolean) required' }, { status: 400 })
  }

  const { admin } = gate
  const { data: existing } = await admin
    .from('services')
    .select('id, title, is_published')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Tjänsten hittades inte.' }, { status: 404 })

  const { error } = await admin
    .from('services')
    .update({ is_disabled: body.is_disabled })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, is_disabled: body.is_disabled, title: existing.title })
}

export async function DELETE(_request: Request, { params }: Params) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { admin } = gate

  const { data: existing, error: lookupError } = await admin
    .from('services')
    .select('id, title')
    .eq('id', params.id)
    .maybeSingle()

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Tjänsten hittades inte.' }, { status: 404 })

  const { error } = await admin.from('services').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, title: existing.title })
}
