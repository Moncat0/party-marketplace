import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const metadata = { title: 'Admin — Talanger' }

export default async function AdminProvidersPage() {
  const supabase = createAdminClient()
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select(
      'id, city, created_at, users!user_id(name, email), services(id, title, category_tags)'
    )
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#222222]">Talanger</h1>
        <span className="text-sm text-[#6A6A6A]">{providers?.length ?? 0} totalt</span>
      </div>

      {!providers || providers.length === 0 ? (
        <p className="text-sm text-[#6A6A6A]">Inga talanger ännu.</p>
      ) : (
        <div className="space-y-2">
          {providers.map((p: any) => {
            const service = Array.isArray(p.services) ? p.services[0] : p.services
            return (
              <div key={p.id} className="rounded-xl bg-white p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#222222] truncate">{service?.title ?? '—'}</p>
                  <p className="text-xs text-[#6A6A6A] truncate">
                    {p.users?.name ?? '—'} · {p.users?.email ?? '—'}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {p.city && (
                      <span className="text-xs text-[#6A6A6A]">📍 {p.city}</span>
                    )}
                    {service?.category_tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="rounded-full bg-[#F2F2F2] px-2 py-0.5 text-xs text-[#6A6A6A]">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {service?.id && (
                    <Link
                      href={`/tjanster/${service.id}`}
                      target="_blank"
                      className="text-xs font-medium text-[#FF6B35] hover:underline"
                    >
                      Visa profil →
                    </Link>
                  )}
                  <span className="text-xs text-[#6A6A6A]">
                    {new Date(p.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
