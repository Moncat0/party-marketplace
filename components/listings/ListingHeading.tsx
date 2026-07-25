'use client'

type Props = {
  title: string
  subtitle?: string
  center?: boolean
}

/** From Luancss Airbnb clone Heading.tsx */
export default function ListingHeading({ title, subtitle, center }: Props) {
  return (
    <div className={center ? 'text-center' : 'text-start'}>
      <div className="text-2xl font-bold text-[#222222]">{title}</div>
      {subtitle && (
        <div className="font-light text-neutral-500 mt-2">{subtitle}</div>
      )}
    </div>
  )
}
