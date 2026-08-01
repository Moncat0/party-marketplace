import type { ReactNode } from 'react'
import { Suspense } from 'react'
import AdminRangeToggle from './AdminRangeToggle'
import type { AdminRange } from '@/lib/admin-range'
import { rangeLabel } from '@/lib/admin-range'

type Props = {
  title: string
  description?: string
  range?: AdminRange
  actions?: ReactNode
}

export default function AdminPageHeader({ title, description, range, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>
        ) : range ? (
          <p className="mt-1 text-[14px] text-muted-foreground">
            Period: {rangeLabel(range)}
            {range !== 'all' ? ' · jämfört med föregående period' : ''}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {range ? (
          <Suspense fallback={null}>
            <AdminRangeToggle value={range} />
          </Suspense>
        ) : null}
      </div>
    </div>
  )
}
