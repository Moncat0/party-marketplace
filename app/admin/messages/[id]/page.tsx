import { createAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Admin — Konversation' }

export default async function AdminConversationPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('booking_requests')
    .select('id, status, event_date, users!planner_id(name, email), services!service_id(title, provider_profiles(users(name, email)))')
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, users!sender_id(name, email)')
    .eq('booking_request_id', params.id)
    .order('created_at', { ascending: true })

  const planner = (Array.isArray(booking.users) ? booking.users[0] : booking.users) as { name: string | null; email: string } | null
  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    title: string | null
    provider_profiles: { users: { name: string | null; email: string } | null } | { users: { name: string | null; email: string } | null }[] | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/messages" className="text-sm text-[#6A6A6A] hover:text-[#222222]">← Tillbaka</Link>
        <h1 className="mt-2 text-xl font-bold text-[#222222]">
          {planner?.name ?? planner?.email} → {profile?.users?.name ?? service?.title}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            booking.status === 'completed' ? 'bg-[#222222]/10 text-[#222222]' : 'bg-[#1D9E75]/10 text-[#1D9E75]'
          }`}>
            {booking.status === 'completed' ? 'Avslutad' : 'Aktiv'}
          </span>
          {booking.event_date && (
            <span className="text-xs text-[#6A6A6A]">
              📅 {new Date(booking.event_date).toLocaleDateString('sv-SE', { dateStyle: 'long' })}
            </span>
          )}
          <span className="text-xs text-[#6A6A6A]">{messages?.length ?? 0} meddelanden</span>
        </div>
      </div>

      <div className="space-y-2">
        {!messages?.length ? (
          <p className="text-sm text-[#6A6A6A] py-8 text-center">Inga meddelanden i den här konversationen.</p>
        ) : (
          messages.map(msg => {
            const sender = (Array.isArray(msg.users) ? msg.users[0] : msg.users) as { name: string | null; email: string } | null
            const isPlanner = sender?.email === planner?.email

            return (
              <div key={msg.id} className={`flex gap-3 ${isPlanner ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isPlanner ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-[#222222]/10 text-[#222222]'
                }`}>
                  {(sender?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 ${isPlanner ? '' : 'flex flex-col items-end'}`}>
                  <p className="text-xs text-[#6A6A6A] mb-1">
                    <span className="font-medium text-[#222222]">{sender?.name ?? sender?.email ?? 'Okänd'}</span>
                    {' · '}{new Date(msg.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mb-2">
                      <div className="relative w-40 h-40 rounded-xl overflow-hidden">
                        <Image src={msg.image_url} alt="Bifogad bild" fill className="object-cover" sizes="160px" />
                      </div>
                    </a>
                  )}
                  {msg.content && (
                    <div className={`inline-block rounded-2xl px-4 py-2.5 max-w-md ${
                      isPlanner ? 'bg-white shadow-sm text-[#222222]' : 'bg-[#222222] text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
