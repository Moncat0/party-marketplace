'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import BrandLogo from '@/components/shared/BrandLogo'
import { cn } from '@/lib/utils'

type Palette = {
  id: string
  label: string
  primary: string
  primaryHover: string
  primarySoft: string
  accent: string
  accentSoft: string
  ink: string
  muted: string
  hairline: string
  canvas: string
}

const PALETTES: Palette[] = [
  {
    id: 'gigtorget',
    label: 'Gigtorget (for-talanger)',
    primary: '#FF2E8A',
    primaryHover: '#E01F74',
    primarySoft: '#FFE6F2',
    accent: '#FF6A00',
    accentSoft: '#FFF3E6',
    ink: '#111111',
    muted: '#5C5C5C',
    hairline: '#E8DDCE',
    canvas: '#FFFFFF',
  },
  {
    id: 'ember',
    label: 'Ember hybrid',
    primary: '#FF6B35',
    primaryHover: '#E55A26',
    primarySoft: '#FFE8DE',
    accent: '#FF2E8A',
    accentSoft: '#FFF3E6',
    ink: '#222222',
    muted: '#6A6A6A',
    hairline: '#DDDDDD',
    canvas: '#FFFFFF',
  },
  {
    id: 'rausch',
    label: 'Airbnb Rausch',
    primary: '#FF385C',
    primaryHover: '#E00B41',
    primarySoft: '#FFD1DA',
    accent: '#222222',
    accentSoft: '#F7F7F7',
    ink: '#222222',
    muted: '#6A6A6A',
    hairline: '#DDDDDD',
    canvas: '#FFFFFF',
  },
]

const DISPLAY_FONTS = [
  { id: 'anton', label: 'Anton', css: 'var(--lab-anton)', uppercase: true },
  { id: 'bebas', label: 'Bebas Neue', css: 'var(--lab-bebas)', uppercase: true },
  { id: 'archivo', label: 'Archivo Black', css: 'var(--lab-archivo)', uppercase: true },
  { id: 'jakarta-d', label: 'Plus Jakarta', css: 'var(--lab-jakarta-display)', uppercase: false },
] as const

const BODY_FONTS = [
  { id: 'quicksand', label: 'Quicksand', css: 'var(--lab-quicksand)' },
  { id: 'jakarta', label: 'Plus Jakarta', css: 'var(--lab-jakarta)' },
  { id: 'dm', label: 'DM Sans', css: 'var(--lab-dm)' },
  { id: 'nunito', label: 'Nunito', css: 'var(--lab-nunito)' },
] as const

const HAND_FONTS = [
  { id: 'caveat', label: 'Caveat', css: 'var(--lab-caveat)' },
  { id: 'patrick', label: 'Patrick Hand', css: 'var(--lab-patrick)' },
  { id: 'kalam', label: 'Kalam', css: 'var(--lab-kalam)' },
] as const

const CARDS = [
  { title: 'DJ Elin — bröllop & klubb', cat: 'DJ', price: 'Från 4 500 kr', rating: '4.9', count: '23' },
  { title: 'Makeup med Maria', cat: 'Makeup', price: 'Från 1 200 kr', rating: '4.8', count: '12' },
  { title: 'Festfotografen Leo', cat: 'Foto', price: 'Från 3 800 kr', rating: '5.0', count: '41' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--ink)]/55">{children}</p>
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--hairline)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
    >
      {options.map(o => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--hairline)] bg-white px-2.5 py-2">
      <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-[var(--muted)]">{value}</span>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </span>
    </label>
  )
}

export default function DesignLabClient() {
  const [paletteId, setPaletteId] = useState('gigtorget')
  const [colors, setColors] = useState<Palette>(PALETTES[0])
  const [displayId, setDisplayId] = useState<(typeof DISPLAY_FONTS)[number]['id']>('anton')
  const [bodyId, setBodyId] = useState<(typeof BODY_FONTS)[number]['id']>('quicksand')
  const [handId, setHandId] = useState<(typeof HAND_FONTS)[number]['id']>('caveat')
  const [pageSurface, setPageSurface] = useState<'cream' | 'white'>('cream')
  const [elevation, setElevation] = useState<'soft' | 'flat'>('soft')

  const display = DISPLAY_FONTS.find(f => f.id === displayId) ?? DISPLAY_FONTS[0]
  const body = BODY_FONTS.find(f => f.id === bodyId) ?? BODY_FONTS[0]
  const hand = HAND_FONTS.find(f => f.id === handId) ?? HAND_FONTS[0]

  const pageBg = pageSurface === 'cream' ? colors.accentSoft : colors.canvas
  const elevShadow =
    elevation === 'flat' ? '5px 5px 0 var(--ink)' : '0 6px 20px rgba(17,17,17,0.10)'

  const style = useMemo(
    () =>
      ({
        '--primary': colors.primary,
        '--primary-hover': colors.primaryHover,
        '--primary-soft': colors.primarySoft,
        '--accent': colors.accent,
        '--accent-soft': colors.accentSoft,
        '--ink': colors.ink,
        '--muted': colors.muted,
        '--hairline': colors.hairline,
        '--canvas': colors.canvas,
        '--page-bg': pageBg,
        '--elev': elevShadow,
        '--font-display': display.css,
        '--font-body': body.css,
        '--font-hand': hand.css,
        fontFamily: body.css,
        background: pageBg,
        color: colors.ink,
      }) as React.CSSProperties,
    [colors, display.css, body.css, hand.css, pageBg, elevShadow]
  )

  function applyPreset(id: string) {
    const p = PALETTES.find(x => x.id === id)
    if (!p) return
    setPaletteId(id)
    setColors(p)
  }

  function patchColor<K extends keyof Palette>(key: K, value: Palette[K]) {
    setPaletteId('custom')
    setColors(c => ({ ...c, [key]: value }))
  }

  return (
    <div style={style} className="min-h-screen">
      {/* Controls */}
      <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[300px] flex-col border-r border-[var(--hairline)] bg-[var(--accent-soft)]/90 backdrop-blur-md">
        <div className="border-b border-[var(--hairline)] px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--muted)]">Design lab</p>
          <h1 className="mt-1 text-lg font-bold leading-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-body)' }}>
            Marketing website
          </h1>
          <p className="mt-1 text-xs leading-snug text-[var(--muted)]">
            Expanded from <code className="text-[var(--ink)]">design system/</code> kit + Airbnb bones.
          </p>
          <div className="mt-3 flex flex-col gap-1">
            <Link href="/for-talanger" className="text-xs font-bold text-[var(--primary)] underline-offset-2 hover:underline">
              Open /for-talanger →
            </Link>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div>
            <FieldLabel>Palette preset</FieldLabel>
            <Select
              value={paletteId === 'custom' ? 'gigtorget' : paletteId}
              onChange={applyPreset}
              options={PALETTES.map(p => ({ id: p.id, label: p.label }))}
            />
            {paletteId === 'custom' && (
              <p className="mt-1 text-[11px] font-semibold text-[var(--accent)]">Custom (edited)</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel>Colors</FieldLabel>
            <ColorInput label="Primary (pink)" value={colors.primary} onChange={v => patchColor('primary', v)} />
            <ColorInput label="Primary hover" value={colors.primaryHover} onChange={v => patchColor('primaryHover', v)} />
            <ColorInput label="Secondary (orange)" value={colors.accent} onChange={v => patchColor('accent', v)} />
            <ColorInput label="Cream" value={colors.accentSoft} onChange={v => patchColor('accentSoft', v)} />
            <ColorInput label="Ink" value={colors.ink} onChange={v => patchColor('ink', v)} />
            <ColorInput label="Muted" value={colors.muted} onChange={v => patchColor('muted', v)} />
          </div>

          <div>
            <FieldLabel>Page surface</FieldLabel>
            <Select
              value={pageSurface}
              onChange={v => setPageSurface(v as 'cream' | 'white')}
              options={[
                { id: 'cream', label: 'Cream (kit default atmosphere)' },
                { id: 'white', label: 'White (browse density)' },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Elevation</FieldLabel>
            <Select
              value={elevation}
              onChange={v => setElevation(v as 'soft' | 'flat')}
              options={[
                { id: 'soft', label: 'Soft blur (UI chrome)' },
                { id: 'flat', label: 'Flat poster (marketing moments)' },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Display font</FieldLabel>
            <Select value={displayId} onChange={v => setDisplayId(v as typeof displayId)} options={[...DISPLAY_FONTS]} />
          </div>
          <div>
            <FieldLabel>Body / UI font</FieldLabel>
            <Select value={bodyId} onChange={v => setBodyId(v as typeof bodyId)} options={[...BODY_FONTS]} />
          </div>
          <div>
            <FieldLabel>Hand / vibe font</FieldLabel>
            <Select value={handId} onChange={v => setHandId(v as typeof handId)} options={[...HAND_FONTS]} />
          </div>

          <div className="rounded-xl border border-[var(--hairline)] bg-white/80 p-3 text-[11px] leading-relaxed text-[var(--muted)]">
            Spec: <code className="text-[var(--ink)]">docs/design-system/marketing/DESIGN.md</code>
            <br />
            Full kit: <code className="text-[var(--ink)]">design system/</code>
            <br />
            Voice: <code className="text-[var(--ink)]">uploads/gigtorget-tone-of-voice-guide-sv.md</code>
          </div>
        </div>
      </aside>

      {/* Preview canvas */}
      <main className="ml-[300px] min-h-screen">
        {/* Airbnb-style nav */}
        <header className="sticky top-0 z-40 flex h-20 items-center border-b border-[var(--hairline)] bg-[var(--page-bg)]/95 px-8 backdrop-blur">
          <BrandLogo href={null} />
          <div
            className="mx-auto flex h-14 max-w-xl flex-1 items-center rounded-full border border-[var(--hairline)] bg-white px-2"
            style={{ boxShadow: 'var(--elev)' }}
          >
            <div className="flex-1 border-r border-[var(--hairline)] px-4">
              <p className="text-[11px] font-bold text-[var(--ink)]">Var</p>
              <p className="text-[13px] text-[var(--muted)]">Stockholm</p>
            </div>
            <div className="flex-1 px-4">
              <p className="text-[11px] font-bold text-[var(--ink)]">Tjänst</p>
              <p className="text-[13px] text-[var(--muted)]">DJ, makeup…</p>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ background: 'var(--primary)' }}
              aria-label="Sök"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            className="ml-6 rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Erbjud din tjänst
          </button>
        </header>

        {/* Hero band */}
        <section className="grid gap-10 px-8 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span
              className="inline-flex h-[26px] items-center rounded-full px-3 text-[11px] font-bold uppercase tracking-[1.5px]"
              style={{ background: 'var(--primary-soft)', color: 'var(--ink)' }}
            >
              För arrangörer i Stockholm
            </span>
            <h2
              className={cn('mt-5 text-[clamp(44px,7vw,80px)] leading-[1.05] tracking-[0.5px]', display.uppercase && 'uppercase')}
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              Hitta talangen.
              <br />
              Skippa krånglet.
            </h2>
            <p className="mt-4 max-w-md text-[19px] leading-relaxed text-[var(--muted)]">
              Boka DJ, kock, makeup och foto till festen — samma marketplace-flow som Airbnb, med party-energi.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className="h-[54px] rounded-full px-7 text-base font-bold text-white transition-colors"
                style={{ background: 'var(--primary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--primary-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--primary)'
                }}
              >
                Utforska talanger
              </button>
              <button
                type="button"
                className="h-[54px] rounded-full border border-[var(--hairline)] bg-white px-7 text-base font-bold text-[var(--ink)]"
              >
                Så funkar det
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md pt-5 pl-5">
            <div
              className="absolute left-0 top-0 h-[calc(100%-20px)] w-[calc(100%-20px)] rounded-[24px]"
              style={{ background: 'var(--primary)' }}
              aria-hidden
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-[var(--hairline)] bg-[var(--ink)]"
              style={{ boxShadow: 'var(--elev)' }}
            >
              <div
                className="absolute inset-0 opacity-90"
                style={{
                  background:
                    'linear-gradient(145deg, var(--primary) 0%, var(--accent) 55%, #111 100%)',
                }}
              />
              <span className="absolute bottom-3.5 left-3.5 rounded-lg border border-[var(--hairline)] bg-white px-3 py-1 text-[13px] font-bold">
                DJ · Södermalm
              </span>
            </div>
            <div
              className="absolute -bottom-3 right-0 z-[2] flex items-center gap-2 rounded-2xl border border-[var(--hairline)] bg-white px-5 py-3.5"
              style={{ boxShadow: 'var(--elev)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
                <path d="M12 3l2.6 6.2L21 10l-5 4.4L17.4 21 12 17.3 6.6 21 8 14.4 3 10l6.4-.8z" />
              </svg>
              <span className="text-[24px] leading-none text-[var(--ink)]" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>
                Alltid en vibe
              </span>
            </div>
          </div>
        </section>

        {/* Listing grid — Airbnb bones */}
        <section className="px-8 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h3
                className={cn('text-[44px] leading-none tracking-[0.5px]', display.uppercase && 'uppercase')}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Populärt just nu
              </h3>
              <p className="mt-2 text-[var(--muted)]">Services-style cards — 3/2 photo, no card chrome.</p>
            </div>
            <button type="button" className="text-sm font-bold underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              Visa alla
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((card, i) => (
              <article key={card.title} className="group">
                <div className="relative aspect-[3/2] overflow-hidden rounded-[24px]" style={{ background: i % 2 ? 'var(--primary-soft)' : 'var(--accent-soft)' }}>
                  <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(160deg, ${i === 1 ? 'var(--accent)' : 'var(--primary)'}55, transparent 70%)`,
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--ink)]"
                    aria-label="Spara"
                  >
                    ♡
                  </button>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[14px] font-semibold leading-[18px] text-[var(--ink)]">{card.title}</p>
                  <p className="text-[12px] leading-4 text-[var(--muted)]">{card.cat}</p>
                  <p className="text-[12px] leading-4 text-[var(--ink)]">
                    ★ {card.rating} · {card.count}
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--ink)]">{card.price}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Components strip — from design system kit */}
        <section className="border-t border-[var(--hairline)] px-8 py-14">
          <h3
            className={cn('text-[36px] leading-none', display.uppercase && 'uppercase')}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Kit-komponenter
          </h3>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            From <code className="text-[var(--ink)]">design system/components/</code> — pink primary pills, orange secondary, soft badges.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--hairline)] bg-white p-5" style={{ boxShadow: 'var(--elev)' }}>
              <FieldLabel>Buttons</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-full px-[22px] py-3 text-base font-semibold text-white" style={{ background: 'var(--primary)' }}>
                  Boka nu
                </button>
                <button type="button" className="rounded-full px-[22px] py-3 text-base font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Secondary
                </button>
                <button
                  type="button"
                  className="rounded-full border-[1.5px] border-[var(--hairline)] bg-transparent px-[22px] py-3 text-base font-semibold"
                >
                  Outline
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--hairline)] bg-white p-5" style={{ boxShadow: 'var(--elev)' }}>
              <FieldLabel>Badge · Tag · Note</FieldLabel>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-[26px] items-center rounded-full px-3 text-[11px] font-bold uppercase tracking-[1.5px]" style={{ background: 'var(--primary-soft)' }}>
                  Chef&apos;s pick
                </span>
                <span className="inline-flex h-[26px] items-center rounded-full px-3 text-[11px] font-bold" style={{ background: 'var(--accent-soft)' }}>
                  Available
                </span>
                <button type="button" className="rounded-full border border-[var(--hairline)] bg-white px-3 py-1 text-[13px] font-semibold">
                  Catering
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-[13px] font-semibold text-white"
                  style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}
                >
                  DJ
                </button>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--hairline)] bg-white px-4 py-2 text-[13px] font-bold" style={{ boxShadow: 'var(--elev)' }}>
                  <span className="h-2 w-2 rounded-full bg-[#1F8A52]" />
                  Ny förfrågan
                </span>
                <span className="text-[24px] leading-none" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>
                  Alltid en vibe
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--hairline)] bg-white p-5" style={{ boxShadow: 'var(--elev)' }}>
              <FieldLabel>Type scale</FieldLabel>
              <p className={cn('text-[40px] leading-none', display.uppercase && 'uppercase')} style={{ fontFamily: 'var(--font-display)' }}>
                Display
              </p>
              <p className="mt-2 text-[22px] font-bold">Heading</p>
              <p className="mt-1 text-base text-[var(--muted)]">Body — boka talang till festen.</p>
              <p className="mt-2 text-[24px] leading-none" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>
                Hand note
              </p>
            </div>
          </div>
        </section>

        {/* Voice */}
        <section className="border-t border-[var(--hairline)] px-8 py-14">
          <h3
            className={cn('text-[36px] leading-none', display.uppercase && 'uppercase')}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tonalitet
          </h3>
          <p className="mt-2 max-w-xl text-[var(--muted)]">Swedish dry confidence — outcome first. From the tone guide in the kit.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { bad: 'Du har en ny bokningsförfrågan.', good: 'Någon vill boka DIG till sin fest.' },
              { bad: 'Din bokning har bekräftats.', good: 'Bokat. Den är din för kvällen.' },
              { bad: 'Inga resultat hittades för din sökning.', good: 'Inget här ännu — prova en annan sökning.' },
              { bad: 'Sidan hittades inte.', good: 'Den här står inte på gästlistan.' },
            ].map(row => (
              <div key={row.good} className="rounded-2xl border border-[var(--hairline)] bg-white p-5" style={{ boxShadow: 'var(--elev)' }}>
                <p className="text-sm text-[var(--muted)] line-through">{row.bad}</p>
                <p className="mt-2 text-base font-semibold text-[var(--ink)]">{row.good}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-[var(--hairline)] px-8 py-8 text-sm text-[var(--muted)]">
          Marketing only · Kit in <code className="text-[var(--ink)]">design system/</code> · Spec in{' '}
          <code className="text-[var(--ink)]">docs/design-system/marketing/DESIGN.md</code>
        </footer>
      </main>
    </div>
  )
}
