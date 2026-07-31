import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'
import CookieBanner from '@/components/CookieBanner'
import SiteNav from '@/components/SiteNav'
import AuthHost from '@/components/auth/AuthHost'
import RememberAccountSync from '@/components/auth/RememberAccountSync'
import GoogleOneTap from '@/components/auth/GoogleOneTap'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'FESTEN. — Hitta underhållning till ditt kalas',
    template: '%s | FESTEN.',
  },
  description: 'Hitta och boka lokala talanger till ditt nästa kalas i Stockholm.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    siteName: 'FESTEN.',
    locale: 'sv_SE',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'FESTEN.' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FESTEN.',
    startupImage: '/icons/icon-512.png',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sv">
      <body className={`${jakarta.variable} ${jetbrains.variable} font-sans antialiased bg-white text-[#222222]`}>
        <PostHogProvider>
          <SiteNav />
          {children}
          <AuthHost />
          <RememberAccountSync />
          <GoogleOneTap />
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  )
}
