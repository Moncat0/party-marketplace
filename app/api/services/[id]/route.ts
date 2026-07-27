import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { getProviderForUser, getServiceByIdForProvider } from '@/lib/services'

async function ownedService(serviceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, service: null, error: 'Unauthorized' as const }

  const provider = await getProviderForUser(supabase, user.id)
  if (!provider) return { supabase, user, service: null, error: 'Not a provider' as const }

  const service = await getServiceByIdForProvider(supabase, provider.id, serviceId)
  if (!service) return { supabase, user, service: null, error: 'Not found' as const }

  return { supabase, user, service, error: null }
}

/** Pause / unpause a published service (hidden from search while paused). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owned = await ownedService(params.id)
  if (owned.error === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (owned.error || !owned.service) {
    return NextResponse.json({ error: owned.error ?? 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  if (typeof body.is_disabled !== 'boolean') {
    return NextResponse.json({ error: 'is_disabled required' }, { status: 400 })
  }

  if (body.is_disabled && !owned.service.is_published) {
    return NextResponse.json(
      { error: 'Endast publicerade tjänster kan pausas' },
      { status: 400 }
    )
  }

  const { data, error } = await owned.supabase
    .from('services')
    .update({ is_disabled: body.is_disabled })
    .eq('id', params.id)
    .select('id, is_disabled, is_published')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ service: data })
}

/** Permanently delete a service. Blocked while pending/accepted bookings exist. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owned = await ownedService(params.id)
  if (owned.error === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (owned.error || !owned.service) {
    return NextResponse.json({ error: owned.error ?? 'Not found' }, { status: 404 })
  }

  const { count } = await owned.supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', params.id)
    .in('status', ['pending', 'accepted'])

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'Du kan inte ta bort en tjänst med väntande eller accepterade bokningar. Pausa den tills de är klara.',
      },
      { status: 409 }
    )
  }

  const { error } = await owned.supabase.from('services').delete().eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
