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
  /** 'dark' = black text for light backgrounds (default). 'light' = white text for dark backgrounds. */
  variant?: 'dark' | 'light'
}

/** Gigtorget wordmark — use for all product chrome (header, auth, footer). */
export default function BrandLogo({
  href = '/',
  className,
  height = 40,
  priority = false,
  variant = 'dark',
}: Props) {
  const width = Math.round((height * 600) / 150)
  const src = variant === 'light' ? '/logo-light.svg' : '/logo-dark.svg'
  const image = (
    <Image
      src={src}
      alt="Gigtorget"
      width={width}
      height={height}
      className={cn('block w-auto', height === 32 ? 'h-8' : 'h-auto')}
      style={{ height, width: 'auto' }}
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
