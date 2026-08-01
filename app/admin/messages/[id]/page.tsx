import { createAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar } from 'lucide-react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Admin — Konversation' }
export const dynamic = 'force-dynamic'

export default async function AdminConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(
      'id, status, event_date, users!planner_id(name, email), services!service_id(title, provider_profiles(users(name, email)))'
    )
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, users!sender_id(name, email)')
    .eq('booking_request_id', params.id)
    .order('created_at', { ascending: true })

  const planner = (
    Array.isArray(booking.users) ? booking.users[0] : booking.users
  ) as { name: string | null; email: string } | null
  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    title: string | null
    provider_profiles:
      | {
          users:
            | { name: string | null; email: string }
            | { name: string | null; email: string }[]
            | null
        }
      | {
          users:
            | { name: string | null; email: string }
            | { name: string | null; email: string }[]
            | null
        }[]
      | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  const providerUser = profile?.users
    ? Array.isArray(profile.users)
      ? profile.users[0]
      : profile.users
    : null

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/messages"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
          Tillbaka
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
          {planner?.name ?? planner?.email} → {providerUser?.name ?? service?.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={booking.status} />
          {booking.event_date ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <Calendar className="size-3" strokeWidth={2} aria-hidden />
              {new Date(booking.event_date).toLocaleDateString('sv-SE', {
                dateStyle: 'long',
              })}
            </span>
          ) : null}
          <span className="text-[12px] text-muted-foreground">
            {messages?.length ?? 0} meddelanden
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {!messages?.length ? (
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            Inga meddelanden i den här konversationen.
          </p>
        ) : (
          messages.map(msg => {
            const sender = (
              Array.isArray(msg.users) ? msg.users[0] : msg.users
            ) as { name: string | null; email: string } | null
            const isPlanner = sender?.email === planner?.email

            return (
              <div
                key={msg.id}
                className={cn('flex gap-3', isPlanner ? 'flex-row' : 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isPlanner
                      ? 'bg-primary/10 text-primary'
                      : 'bg-foreground/10 text-foreground'
                  )}
                >
                  {(sender?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className={cn('flex-1', !isPlanner && 'flex flex-col items-end')}>
                  <p className="mb-1 text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {sender?.name ?? sender?.email ?? 'Okänd'}
                    </span>
                    {' · '}
                    {new Date(msg.created_at).toLocaleString('sv-SE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                  {msg.image_url ? (
                    <a
                      href={msg.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2 inline-block"
                    >
                      <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border">
                        <Image
                          src={msg.image_url}
                          alt="Bifogad bild"
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      </div>
                    </a>
                  ) : null}
                  {msg.content ? (
                    <div
                      className={cn(
                        'inline-block max-w-md rounded-2xl px-4 py-2.5',
                        isPlanner
                          ? 'border border-border bg-background text-foreground'
                          : 'bg-foreground text-background'
                      )}
                    >
                      <p className="whitespace-pre-wrap text-[14px]">{msg.content}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
