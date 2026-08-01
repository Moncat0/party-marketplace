import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

/** POST — soft-deactivate. Body: { reactivate?: boolean } */
export async function POST(request: Request, { params }: Params) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { admin, user: adminUser } = gate
  if (params.id === adminUser.id) {
    return NextResponse.json(
      { error: 'Du kan inte inaktivera ditt eget adminkonto.' },
      { status: 400 }
    )
  }

  let reactivate = false
  try {
    const body = (await request.json()) as { reactivate?: boolean }
    reactivate = body.reactivate === true
  } catch {
    // empty body = deactivate
  }

  const { data, error } = await admin
    .from('users')
    .update({ deactivated_at: reactivate ? null : new Date().toISOString() })
    .eq('id', params.id)
    .select('id, deactivated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Användaren hittades inte.' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    reactivated: reactivate,
    deactivated_at: data.deactivated_at,
  })
}
