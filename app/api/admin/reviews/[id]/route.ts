import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await request.json().catch(() => ({}))
  const { admin } = gate

  const { error } = await admin
    .from('reviews')
    .update({ is_hidden: body.is_hidden })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { admin } = gate
  const { error } = await admin.from('reviews').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
