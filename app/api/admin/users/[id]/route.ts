import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

/** DELETE — permanently delete public.users (+ cascade) and auth user when present. */
export async function DELETE(_request: Request, { params }: Params) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { admin, user: adminUser } = gate
  if (params.id === adminUser.id) {
    return NextResponse.json(
      { error: 'Du kan inte radera ditt eget adminkonto härifrån.' },
      { status: 400 }
    )
  }

  const { data: existing, error: lookupError } = await admin
    .from('users')
    .select('id, email')
    .eq('id', params.id)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Användaren hittades inte.' }, { status: 404 })
  }

  // Prefer auth delete first when the account exists (clears sessions).
  const { error: authError } = await admin.auth.admin.deleteUser(params.id)
  const authMissing =
    !!authError &&
    (authError.message.toLowerCase().includes('not found') ||
      authError.message.toLowerCase().includes('user not found'))

  if (authError && !authMissing) {
    return NextResponse.json(
      { error: `Kunde inte radera inloggningen: ${authError.message}` },
      { status: 500 }
    )
  }

  const { data: deleted, error: dbError } = await admin
    .from('users')
    .delete()
    .eq('id', params.id)
    .select('id')

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  if (!deleted?.length) {
    // Auth may have already been removed; public row still blocked somehow
    return NextResponse.json(
      {
        error:
          'Kontot kunde inte raderas från databasen (möjligen blockerat av relaterad data).',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    authDeleted: !authMissing,
    email: existing.email,
  })
}
