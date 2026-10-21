'use client'

import { useEffect, useState } from 'react'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import BrowseSearch from '@/components/navbar/BrowseSearch'

export default function JoinScrollHeader() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(prev => {
          if (!prev && y > 24) return true
          if (prev && y < 8) return false
          return prev
        })
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <MarketplaceHeader
      className="supply-header"
      scrolled={scrolled}
      currentMode="planner"
      loginCta
      center={
        <BrowseSearch
          query={query}
          onQueryChange={setQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          locationId={locationId}
          onLocationChange={setLocationId}
          scrolled={scrolled}
          maxWidth={480}
          emptyLocationLabel="Var ska festen vara?"
          emptyServiceLabel="Vilken tjänst soker du?"
        />
      }
    />
  )
}
