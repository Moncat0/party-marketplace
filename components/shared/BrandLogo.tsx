import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  /** Pass `null` for a bare image (no link). Default `/`. */
  href?: string | null
  className?: string
  /** Image height in px. Default 32. */
  height?: number
  priority?: boolean
}

/** Festly wordmark — use for all product chrome (header, auth, footer). */
export default function BrandLogo({
  href = '/',
  className,
  height = 32,
  priority = false,
}: Props) {
  const width = Math.round((height * 120) / 32)
  const image = (
    <Image
      src="/images/supply/festly-wordmark.svg"
      alt="Festly"
      width={width}
      height={height}
      className={cn('block h-8 w-auto', height !== 32 && 'h-auto')}
      style={height !== 32 ? { height, width: 'auto' } : undefined}
      priority={priority}
    />
  )

  if (href === null) {
    return <span className={cn('inline-flex items-center leading-none', className)}>{image}</span>
  }

  return (
    <Link href={href} className={cn('inline-flex items-center leading-none', className)}>
      {image}
    </Link>
  )
}
