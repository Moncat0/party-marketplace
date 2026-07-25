import Link from 'next/link'

const navLinks = [
  { href: '/admin', label: '📊 Översikt' },
  { href: '/admin/providers', label: '🎭 Talanger' },
  { href: '/admin/users', label: '👤 Användare' },
  { href: '/admin/bookings', label: '📅 Bokningar' },
  { href: '/admin/reviews', label: '⭐ Recensioner' },
  { href: '/admin/messages', label: '💬 Konversationer' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Top bar */}
      <header className="bg-[#1A1A2E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">FESTEN.</span>
          <span className="text-white/40 text-sm">Admin</span>
        </div>
        <Link href="/" className="text-xs text-white/60 hover:text-white transition-colors">
          ← Till sajten
        </Link>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-[#E8E3DC] px-4 overflow-x-auto">
        <div className="flex gap-1 py-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-[#5F5E5A] hover:bg-[#F0EDE8] hover:text-[#1A1A2E] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  )
}
