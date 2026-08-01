import type { ReactNode } from 'react'
import {
  Calendar,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Settings,
  Star,
  User,
} from 'lucide-react'

export type ProviderNavBadges = {
  pendingRequests?: number | null
  unreadMessages?: number | null
}

export type ProviderNavItem = {
  href: string
  label: string
  icon: ReactNode
  badge?: number | null
}

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
}

/** Single source of truth for provider dashboard sidebar links. */
export function getProviderNavItems(badges: ProviderNavBadges = {}): ProviderNavItem[] {
  return [
    {
      href: '/dashboard',
      label: 'Översikt',
      icon: <NavIcon icon={LayoutDashboard} />,
    },
    {
      href: '/dashboard/requests',
      label: 'Förfrågningar',
      badge: badges.pendingRequests,
      icon: <NavIcon icon={Calendar} />,
    },
    {
      href: '/dashboard/messages',
      label: 'Meddelanden',
      badge: badges.unreadMessages,
      icon: <NavIcon icon={MessageSquare} />,
    },
    {
      href: '/dashboard/reviews',
      label: 'Recensioner',
      icon: <NavIcon icon={Star} />,
    },
    {
      href: '/dashboard/profile',
      label: 'Profil',
      icon: <NavIcon icon={User} />,
    },
    {
      href: '/dashboard/account',
      label: 'Inställningar',
      icon: <NavIcon icon={Settings} />,
    },
  ]
}
