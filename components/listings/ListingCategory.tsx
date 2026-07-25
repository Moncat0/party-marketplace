'use client'

type Props = {
  label: string
  description?: string
}

/** ListingCategory without react-icons — tag row for FESTEN categories. */
export default function ListingCategory({ label, description }: Props) {
  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#222222]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="text-lg font-semibold text-[#222222]">{label}</div>
        {description && (
          <div className="font-light text-neutral-500">{description}</div>
        )}
      </div>
    </div>
  )
}
