import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await request.json().catch(() => ({}))
  const { admin, user } = gate

  const update: Record<string, unknown> = { status: body.status }
  if (body.status !== 'open') {
    update.resolved_by = user.id
    update.resolved_at = new Date().toISOString()
  }

  const { error } = await admin.from('reports').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
