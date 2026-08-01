import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LABELS: Record<string, string> = {
  pending: 'Väntande',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  completed: 'Klar',
  planner: 'Planerare',
  provider: 'Talang',
}

const STYLES: Record<string, string> = {
  pending: 'border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100',
  accepted: 'border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
  declined: 'border-transparent bg-red-100 text-red-900 hover:bg-red-100',
  completed: 'border-transparent bg-sky-100 text-sky-900 hover:bg-sky-100',
  planner: 'border-transparent bg-secondary text-secondary-foreground',
  provider: 'border-transparent bg-primary/10 text-primary',
}

export default function AdminStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn('rounded-full font-medium', STYLES[status], className)}
    >
      {LABELS[status] ?? status}
    </Badge>
  )
}
