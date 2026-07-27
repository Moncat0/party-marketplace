'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  loadQuickReplies,
  loadSuggestedRepliesEnabled,
  setThreadArchived,
  type QuickReply,
} from '@/lib/messaging-prefs'
import { cn } from '@/lib/utils'
import { formatEventType } from '@/lib/event-types'

type Quote = {
  id: string
  price_ore: number
  description: string | null
  duration: string | null
  event_date: string | null
  location: string | null
  cancellation_policy: string | null
  status: 'pending' | 'accepted' | 'declined'
}

type Message = {
  id: string
  content: string | null
  image_url: string | null
  quote_id: string | null
  quotes: Quote | null
  sender_id: string
  created_at: string
  read_at: string | null
  users: { name: string | null } | null
}

type Props = {
  bookingId: string
  currentUserId: string
  messages: Message[]
  otherName: string
  isPlanner: boolean
  isProvider: boolean
  isCompleted: boolean
  eventDate: string | null
  eventLocation: string | null
  guestCount?: number | null
  eventType?: string | null
  /** When the booking request was created — used for the date header */
  inquiryAt?: string | null
  serviceId?: string | null
  serviceTitle?: string | null
  /** When true, fill parent pane instead of full-page chrome */
  embedded?: boolean
  /** Show back link to inbox (useful when embedded in guest chrome) */
  showBackLink?: boolean
}

export default function MessageThread({
  bookingId,
  currentUserId,
  messages: initial,
  otherName,
  isPlanner,
  isProvider,
  isCompleted,
  eventDate,
  eventLocation,
  guestCount = null,
  eventType = null,
  inquiryAt = null,
  serviceId = null,
  serviceTitle = null,
  embedded = false,
  showBackLink,
}: Props) {
  const [messages, setMessages] = useState(initial)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)

  // Quote form state
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteDescription, setQuoteDescription] = useState('')
  const [quoteDuration, setQuoteDuration] = useState('')
  const [quoteDate, setQuoteDate] = useState(eventDate ?? '')
  const [quoteLocation, setQuoteLocation] = useState(eventLocation ?? '')
  const [quoteCancellation, setQuoteCancellation] = useState('Ingen återbetalning')
  const [sendingQuote, setSendingQuote] = useState(false)
  const [respondingToQuote, setRespondingToQuote] = useState<string | null>(null)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [suggestedOn, setSuggestedOn] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const backHref = isPlanner ? '/planner/messages' : '/dashboard/messages'
  const initial1 = otherName.charAt(0).toUpperCase()
  const showBack = showBackLink ?? !embedded
  const otherRole = isPlanner ? 'Talang' : 'Arrangör'
  const myRole = isPlanner ? 'Arrangör' : 'Talang'
  const firstName = otherName.split(' ')[0] ?? otherName

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [replies, enabled] = await Promise.all([
        loadQuickReplies(currentUserId),
        loadSuggestedRepliesEnabled(currentUserId),
      ])
      if (cancelled) return
      setQuickReplies(replies)
      setSuggestedOn(enabled)
    })()
    return () => {
      cancelled = true
    }
  }, [currentUserId])

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/messages?booking_request_id=${bookingId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [bookingId])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Bilden är för stor. Max 5 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploadProgress(true)
    const ext = file.name.split('.').pop()
    const path = `${bookingId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('message-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    setUploadProgress(false)
    if (error) { console.error('Upload failed', error); return null }
    const { data } = supabase.storage.from('message-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if ((!content.trim() && !imageFile) || sending) return
    setSending(true)

    let imageUrl: string | null = null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (!imageUrl) { setSending(false); return }
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_request_id: bookingId,
        content: content.trim() || null,
        image_url: imageUrl,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, { ...data.message, quotes: null }])
      setContent('')
      clearImage()
      track('message_sent', {
        booking_id: bookingId,
        has_image: !!imageUrl,
        content_length: content.trim().length,
        sender_type: isPlanner ? 'planner' : 'provider',
      })
    }
    setSending(false)
  }

  async function handleSendQuote(e: React.FormEvent) {
    e.preventDefault()
    if (!quotePrice || Number(quotePrice) < 1 || sendingQuote) return
    setSendingQuote(true)

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_request_id: bookingId,
        price_sek: Number(quotePrice),
        description: quoteDescription.trim() || null,
        duration: quoteDuration.trim() || null,
        event_date: quoteDate || null,
        location: quoteLocation.trim() || null,
        cancellation_policy: quoteCancellation,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setShowQuoteForm(false)
      setQuotePrice('')
      setQuoteDescription('')
      setQuoteDuration('')
      setQuoteLocation(eventLocation ?? '')
      setQuoteDate(eventDate ?? '')
      setQuoteCancellation('Ingen återbetalning')
    }
    setSendingQuote(false)
  }

  async function handleQuoteResponse(quoteId: string, status: 'accepted' | 'declined') {
    setRespondingToQuote(quoteId)
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.quote_id === quoteId && m.quotes
          ? { ...m, quotes: { ...m.quotes, status } }
          : m
      ))
    }
    setRespondingToQuote(null)
  }

  async function handleArchive() {
    setArchiving(true)
    try {
      await setThreadArchived(currentUserId, bookingId, true)
      setInfoOpen(false)
      router.push(backHref)
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white',
        embedded ? 'h-full min-h-0 overflow-hidden' : 'min-h-screen'
      )}
    >

      {/* Airbnb-style thread header */}
      <header className="z-10 flex-shrink-0 border-b border-[#ebebeb] bg-white">
        <div className={`${embedded ? 'px-4' : 'max-w-3xl mx-auto px-6'} h-16 flex items-center gap-3`}>
          {showBack && (
            <Link
              href={backHref}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-[#f7f7f7] text-[#222222]"
              aria-label="Tillbaka till meddelanden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-sm font-semibold text-[#222222]">
              {initial1}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-[#222222]">
                {otherName}
              </p>
              <p className="mt-0.5 text-[12px] text-[#6a6a6a]">
                {isCompleted ? 'Avslutad bokning' : otherRole}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInfoOpen(true)}
            className="h-9 flex-shrink-0 gap-1.5 rounded-full border-[#dddddd] px-3 text-[13px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
            aria-label="Tjänst och konversation"
          >
            Tjänst
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Messages + input */}
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden w-full ${embedded ? '' : 'max-w-3xl mx-auto'}`}>

        {/* Messages scroll area */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
          <InquiryBanner
            isPlanner={isPlanner}
            inquiryAt={inquiryAt}
            eventDate={eventDate}
            eventLocation={eventLocation}
            guestCount={guestCount}
            eventType={eventType}
            serviceId={serviceId}
            serviceTitle={serviceTitle}
          />

          {messages.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-2xl">
                👋
              </div>
              <p className="mb-1 text-[16px] font-semibold text-[#222222]">Ingen har skrivit än</p>
              <p className="text-[14px] text-[#6a6a6a]">Säg hej till {firstName}!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId
            const prevMsg = messages[i - 1]
            const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id
            const timeLabel = new Date(msg.created_at).toLocaleTimeString('sv-SE', {
              hour: '2-digit',
              minute: '2-digit',
            })

            // Quote card — full width, centered
            if (msg.quote_id && msg.quotes) {
              const quote = msg.quotes
              const priceSek = Math.round(quote.price_ore / 100).toLocaleString('sv-SE')
              const providerNet = Math.round(quote.price_ore * 0.8 / 100).toLocaleString('sv-SE')

              return (
                <div key={msg.id} className="flex flex-col items-center py-2">
                  <p className="mb-2 text-[12px] text-[#6a6a6a]">
                    {isMe ? 'Du' : otherName} skickade en offert · {timeLabel}
                  </p>
                  <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-sm">
                    <div className="bg-[#222222] px-5 py-4">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">Offert</p>
                      <p className="text-2xl font-bold text-white">{priceSek} kr</p>
                      {!isPlanner && (
                        <p className="mt-0.5 text-xs text-white/50">Du får: {providerNet} kr (efter FESTEN.s avgift)</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-[#ebebeb] px-5 py-4">
                      {quote.event_date && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">Datum</p>
                          <p className="text-sm text-[#222222]">{new Date(quote.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      )}
                      {quote.duration && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">Längd</p>
                          <p className="text-sm text-[#222222]">{quote.duration}</p>
                        </div>
                      )}
                      {quote.location && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">Plats</p>
                          <p className="text-sm text-[#222222]">{quote.location}</p>
                        </div>
                      )}
                      {quote.cancellation_policy && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">Avbokning</p>
                          <p className="text-sm text-[#222222]">{quote.cancellation_policy}</p>
                        </div>
                      )}
                    </div>
                    {quote.description && (
                      <div className="border-b border-[#ebebeb] px-5 py-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">Vad ingår</p>
                        <p className="text-sm leading-relaxed text-[#222222]">{quote.description}</p>
                      </div>
                    )}

                    <div className="px-5 py-4">
                      {quote.status === 'pending' && isPlanner && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleQuoteResponse(quote.id, 'declined')}
                            disabled={respondingToQuote === quote.id}
                            className="h-auto flex-1 rounded-xl py-2.5 text-xs text-muted-foreground"
                          >
                            Avböj
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleQuoteResponse(quote.id, 'accepted')}
                            disabled={respondingToQuote === quote.id}
                            className="h-auto flex-1 rounded-xl bg-success py-2.5 text-xs font-semibold text-white hover:bg-success/90"
                          >
                            {respondingToQuote === quote.id ? '...' : 'Acceptera offert →'}
                          </Button>
                        </div>
                      )}
                      {quote.status === 'pending' && !isPlanner && (
                        <p className="text-center text-xs text-[#6a6a6a]">Väntar på svar från {firstName}...</p>
                      )}
                      {quote.status === 'accepted' && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#1D9E75]" />
                          <p className="text-xs font-semibold text-[#1D9E75]">Offert accepterad — betalning väntar</p>
                        </div>
                      )}
                      {quote.status === 'declined' && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#6a6a6a]" />
                          <p className="text-xs text-[#6a6a6a]">Offert avböjd</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Regular message — Airbnb bubble rhythm
            return (
              <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <div className="w-8 flex-shrink-0 self-end">
                  {!isMe && showSender ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f2] text-[11px] font-semibold text-[#222222]">
                      {initial1}
                    </div>
                  ) : (
                    <div className="h-8 w-8" />
                  )}
                </div>

                <div className={cn('flex max-w-[72%] flex-col', isMe ? 'items-end' : 'items-start')}>
                  {showSender && (
                    <p className="mb-1 px-1 text-[12px] text-[#6a6a6a]">
                      {isMe ? (
                        timeLabel
                      ) : (
                        <>
                          <span className="font-medium text-[#222222]">{otherName}</span>
                          {' · '}
                          {otherRole}
                          {' '}
                          {timeLabel}
                        </>
                      )}
                    </p>
                  )}

                  {msg.image_url && (
                    <div className="mb-1 overflow-hidden rounded-2xl">
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <div className="relative h-56 w-56">
                          <Image
                            src={msg.image_url}
                            alt="Bifogad bild"
                            fill
                            className="object-cover transition-opacity hover:opacity-95"
                            sizes="224px"
                          />
                        </div>
                      </a>
                    </div>
                  )}

                  {msg.content && (
                    <div
                      className={cn(
                        'rounded-[20px] px-4 py-2.5',
                        isMe
                          ? 'rounded-br-md bg-[#222222] text-white'
                          : 'rounded-bl-md bg-[#f2f2f2] text-[#222222]'
                      )}
                    >
                      <p className="whitespace-pre-wrap text-[15px] leading-[1.4]">{msg.content}</p>
                    </div>
                  )}

                  {isMe && msg.read_at && (
                    <p className="mt-1 px-1 text-[11px] text-[#b0b0b0]">Läst</p>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {isCompleted && (
          <div className="mx-5 mb-4 rounded-2xl border border-[#ebebeb] bg-[#f7f7f7] px-5 py-3 text-center sm:mx-8">
            <p className="text-sm text-[#6a6a6a]">Det här evenemanget är avslutat. Du kan fortfarande läsa konversationen.</p>
          </div>
        )}

        {/* Quote form panel (provider only) */}
        {showQuoteForm && !isCompleted && (
          <div className="max-h-[70vh] flex-shrink-0 overflow-y-auto border-t border-[#ebebeb] bg-white px-6 py-5">
            <form onSubmit={handleSendQuote}>
              <p className="mb-4 text-sm font-bold text-[#222222]">Skicka offert</p>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Pris *</label>
                  <div className="relative">
                    <input
                      type="number" min="1" value={quotePrice}
                      onChange={e => setQuotePrice(e.target.value)}
                      placeholder="3 000"
                      className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 pr-10 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a6a6a]">kr</span>
                  </div>
                  {quotePrice && Number(quotePrice) > 0 && (
                    <p className="mt-1 text-xs text-[#6a6a6a]">Du får: <span className="font-semibold text-[#1D9E75]">{Math.round(Number(quotePrice) * 0.8).toLocaleString('sv-SE')} kr</span></p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Tid/längd</label>
                  <input
                    type="text" value={quoteDuration}
                    onChange={e => setQuoteDuration(e.target.value)}
                    placeholder="T.ex. 2 timmar"
                    className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Datum</label>
                  <input
                    type="date" value={quoteDate}
                    onChange={e => setQuoteDate(e.target.value)}
                    className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Plats</label>
                  <input
                    type="text" value={quoteLocation}
                    onChange={e => setQuoteLocation(e.target.value)}
                    placeholder="T.ex. Vasastan, Stockholm"
                    className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Vad ingår</label>
                <textarea
                  value={quoteDescription}
                  onChange={e => setQuoteDescription(e.target.value)}
                  placeholder="T.ex. 2 timmars uppträdande, eget ljud och ljus..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Avbokningsvillkor</label>
                <select
                  value={quoteCancellation}
                  onChange={e => setQuoteCancellation(e.target.value)}
                  className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                >
                  <option>Ingen återbetalning</option>
                  <option>50% återbetalning vid avbokning 7+ dagar innan</option>
                  <option>Full återbetalning vid avbokning 14+ dagar innan</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={!quotePrice || Number(quotePrice) < 1 || sendingQuote}
                  className="h-auto rounded-xl px-5 py-2.5 text-xs"
                >
                  {sendingQuote ? '...' : 'Skicka offert'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowQuoteForm(false); setQuotePrice(''); setQuoteDescription('') }}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Composer — Airbnb rounded pill */}
        {!isCompleted && !showQuoteForm && (
          <div className="flex-shrink-0 border-t border-[#ebebeb] bg-white px-4 py-4 sm:px-6">
            {suggestedOn && quickReplies.length > 0 && (
              <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
                {quickReplies.map(r => (
                  <Button
                    key={r.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContent(r.body)}
                    className="h-8 flex-shrink-0 rounded-full border-[#dddddd] px-3 text-[13px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
                  >
                    {r.title}
                  </Button>
                ))}
              </div>
            )}
            {imagePreview && (
              <div className="mb-3 flex items-start gap-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="56px" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearImage}
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                >
                  Ta bort
                </Button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 flex-shrink-0 rounded-full text-[#222222] hover:bg-[#f7f7f7]"
                title="Bifoga bild"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

              <div className="relative flex min-h-[48px] flex-1 items-end rounded-[28px] border border-[#b0b0b0] bg-white px-4 py-2 focus-within:border-[#222222]">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
                  }}
                  placeholder="Skriv ett meddelande..."
                  rows={1}
                  className="max-h-[120px] min-h-[28px] w-full flex-1 resize-none bg-transparent py-1.5 pr-12 text-[15px] text-[#222222] placeholder:text-[#717171] focus:outline-none"
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = `${t.scrollHeight}px`
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!content.trim() && !imageFile) || sending || uploadProgress}
                  className={cn(
                    'absolute bottom-1.5 right-1.5 h-9 w-9 rounded-full shadow-none',
                    content.trim() || imageFile
                      ? 'bg-[#222222] text-white hover:bg-[#000]'
                      : 'bg-[#dddddd] text-white hover:bg-[#dddddd]'
                  )}
                  aria-label="Skicka"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </Button>
              </div>

              {isProvider && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuoteForm(true)}
                  className="h-11 flex-shrink-0 rounded-full border-[#222222] px-4 text-[13px] font-semibold text-[#222222] shadow-none hover:bg-[#f7f7f7]"
                >
                  Offert
                </Button>
              )}
            </form>
          </div>
        )}
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl p-0 sm:max-w-md" showClose={false}>
          <DialogHeader className="relative border-b border-[#ebebeb] px-5 py-4 text-center">
            <DialogTitle className="text-[16px] font-semibold text-[#222222]">
              I den här konversationen
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setInfoOpen(false)}
              className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              aria-label="Stäng"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </DialogHeader>

          <div className="px-5 py-5">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
              Deltagare
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f2f2] text-[15px] font-semibold text-[#222222]">
                  {initial1}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#222222]">{otherName}</p>
                  <p className="text-[13px] text-[#6a6a6a]">{otherRole}</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222222] text-[15px] font-semibold text-white">
                  Du
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#222222]">Du</p>
                  <p className="text-[13px] text-[#6a6a6a]">{myRole}</p>
                </div>
              </li>
            </ul>

            <div className="my-6 border-t border-[#ebebeb]" />

            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
              Åtgärder
            </p>
            <button
              type="button"
              onClick={() => void handleArchive()}
              disabled={archiving}
              className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-[#f7f7f7]"
            >
              <span className="flex h-9 w-9 items-center justify-center text-[#222222]" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </span>
              <span className="text-[15px] font-medium text-[#222222]">
                {archiving ? 'Arkiverar…' : 'Arkivera'}
              </span>
            </button>
            <Link
              href="/hjalp"
              className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-[#f7f7f7]"
              onClick={() => setInfoOpen(false)}
            >
              <span className="flex h-9 w-9 items-center justify-center text-[#222222]" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <span className="text-[15px] font-medium text-[#222222]">Besök hjälpcentret</span>
            </Link>

            <div className="my-6 border-t border-[#ebebeb]" />

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
              Bra att tänka på
            </p>
            <p className="text-[13px] leading-relaxed text-[#6a6a6a]">
              För att skydda din betalning och kommunikation, använd alltid FESTEN. när du bokar
              och pratar med {isPlanner ? 'talanger' : 'arrangörer'}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InquiryBanner({
  isPlanner,
  inquiryAt,
  eventDate,
  eventLocation,
  guestCount,
  eventType,
  serviceId,
  serviceTitle,
}: {
  isPlanner: boolean
  inquiryAt: string | null
  eventDate: string | null
  eventLocation: string | null
  guestCount: number | null
  eventType: string | null
  serviceId: string | null
  serviceTitle: string | null
}) {
  const hasDetails = eventDate || eventLocation || guestCount != null || eventType
  if (!hasDetails && !inquiryAt) return null

  const dateHeader = new Date(inquiryAt ?? eventDate ?? Date.now()).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  })

  const eventDateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
      })
    : null

  const parts: string[] = []
  if (guestCount != null && guestCount > 0) {
    parts.push(`${guestCount} ${guestCount === 1 ? 'gäst' : 'gäster'}`)
  }
  if (eventDateLabel) {
    parts.push(eventDateLabel)
  } else if (eventType) {
    const label = formatEventType(eventType)
    if (label) parts.push(label.toLowerCase())
  }
  if (eventLocation) parts.push(eventLocation)

  const detail =
    parts.length === 0
      ? null
      : guestCount != null && guestCount > 0 && eventDateLabel
        ? `${parts[0]} den ${parts[1]}${parts.length > 2 ? ` · ${parts.slice(2).join(' · ')}` : ''}`
        : parts.join(' · ')

  const summary = isPlanner
    ? detail
      ? `Din förfrågan för ${detail} har skickats.`
      : 'Din förfrågan har skickats.'
    : detail
      ? `Förfrågan för ${detail} har mottagits.`
      : 'En förfrågan har mottagits.'

  const listingHref = serviceId ? `/tjanster/${serviceId}` : null

  return (
    <div className="mx-auto max-w-lg px-2 pb-2 pt-1 text-center">
      <p className="mb-2 text-[14px] font-semibold text-[#222222]">{dateHeader}</p>
      <p className="text-[14px] leading-relaxed text-[#6a6a6a]">
        {summary}
        {listingHref ? (
          <>
            {' '}
            <Link
              href={listingHref}
              className="font-medium text-[#222222] underline underline-offset-[3px]"
            >
              Visa tjänst
            </Link>
          </>
        ) : null}
      </p>
    </div>
  )
}
