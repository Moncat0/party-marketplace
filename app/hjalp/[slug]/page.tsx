import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HELP_ARTICLES, getArticle } from '@/lib/help'

type Props = { params: { slug: string } }

export function generateStaticParams() {
  return HELP_ARTICLES.map(a => ({ slug: a.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.slug)
  if (!article) return { title: 'Artikel' }
  return {
    title: article.title,
    description: article.summary,
  }
}

export default function HelpArticlePage({ params }: Props) {
  const article = getArticle(params.slug)
  if (!article) notFound()

  return (
    <div className="min-h-screen bg-background">
      <article className="mx-auto w-full max-w-[720px] px-6 py-10 sm:px-10 sm:py-14">
        <Link
          href="/hjalp"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#222222] hover:underline"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M7.5 2.5L4 6l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Hjälpcenter
        </Link>

        <h1 className="mt-6 text-[28px] font-semibold leading-9 tracking-[-0.03em] text-[#222222] sm:text-[32px] sm:leading-10">
          {article.title}
        </h1>
        <p className="mt-3 text-[16px] leading-6 text-[#6A6A6A]">{article.summary}</p>

        <div className="mt-8 space-y-4 border-t border-[#DDDDDD] pt-8">
          {article.body.map(paragraph => (
            <p key={paragraph} className="text-[16px] leading-6 text-[#222222]">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-[#DDDDDD] pt-8">
          <Button asChild variant="dark" className="h-12 rounded-lg px-6 text-[16px] font-medium">
            <Link href="/hjalp">Fler artiklar</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-lg border-[#222222] px-6 text-[16px] font-medium shadow-none"
          >
            <Link href="/">Till FESTEN.</Link>
          </Button>
        </div>
      </article>
    </div>
  )
}
