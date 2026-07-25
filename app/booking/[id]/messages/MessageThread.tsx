'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import {
  loadQuickReplies,
  loadSuggestedRepliesEnabled,
  type QuickReply,
} from '@/lib/messaging-prefs'

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
  /** When true, fill parent pane instead of full-page chrome */
  embedded?: boolean
  /** Show back link to inbox (useful when embedded in guest chrome) */
  showBackLink?: boolean
}

export default function MessageThread({
  bookingId, currentUserId, messages: initial, otherName, isPlanner, isProvider, isCompleted, eventDate, eventLocation,
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

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const backHref = isPlanner ? '/planner/messages' : '/dashboard/messages'
  const initial1 = otherName.charAt(0).toUpperCase()
  const showBack = showBackLink ?? !embedded

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

  return (
    <div className={`${embedded ? 'h-full min-h-0' : 'min-h-screen'} bg-[#F2F2F2] flex flex-col`}>

      {/* Top nav bar */}
      <header className="bg-white border-b border-[#EBEBEB] flex-shrink-0 sticky top-0 z-10">
        <div className={`${embedded ? 'px-4' : 'max-w-3xl mx-auto px-6'} h-14 flex items-center gap-4`}>
          {showBack && (
            <>
              <Link
                href={backHref}
                className="flex items-center gap-2 text-sm font-medium text-[#6A6A6A] hover:text-[#222222] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Alla meddelanden
              </Link>
              <span className="text-[#EBEBEB]">/</span>
            </>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-xs font-bold text-[#FF6B35] flex-shrink-0">
              {initial1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#222222] leading-none truncate">{otherName}</p>
              <p className="text-xs text-[#6A6A6A] mt-0.5">{isCompleted ? 'Avslutat event' : 'Aktiv bokning'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages + input */}
      <div className={`flex-1 flex flex-col min-h-0 w-full ${embedded ? '' : 'max-w-3xl mx-auto'}`}>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-2xl mx-auto mb-4">
                👋
              </div>
              <p className="text-base font-semibold text-[#222222] mb-1">Ingen har skrivit än</p>
              <p className="text-sm text-[#6A6A6A]">Säg hej till {otherName}!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId
            const prevMsg = messages[i - 1]
            const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id

            // Quote card — full width, centered
            if (msg.quote_id && msg.quotes) {
              const quote = msg.quotes
              const priceSek = Math.round(quote.price_ore / 100).toLocaleString('sv-SE')
              const providerNet = Math.round(quote.price_ore * 0.8 / 100).toLocaleString('sv-SE')

              return (
                <div key={msg.id} className="flex flex-col items-center py-2">
                  <p className="text-xs text-[#A0A0A0] mb-2">
                    {isMe ? 'Du' : otherName} skickade en offert
                  </p>
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-[#222222] px-5 py-4">
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Offert</p>
                      <p className="text-2xl font-bold text-white">{priceSek} kr</p>
                      {!isPlanner && (
                        <p className="text-xs text-white/50 mt-0.5">Du får: {providerNet} kr (efter FESTEN.s avgift)</p>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="px-5 py-4 border-b border-[#EBEBEB] grid grid-cols-2 gap-3">
                      {quote.event_date && (
                        <div>
                          <p className="text-xs font-semibold text-[#6A6A6A] uppercase tracking-wide mb-0.5">Datum</p>
                          <p className="text-sm text-[#222222]">{new Date(quote.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      )}
                      {quote.duration && (
                        <div>
                          <p className="text-xs font-semibold text-[#6A6A6A] uppercase tracking-wide mb-0.5">Längd</p>
                          <p className="text-sm text-[#222222]">{quote.duration}</p>
                        </div>
                      )}
                      {quote.location && (
                        <div>
                          <p className="text-xs font-semibold text-[#6A6A6A] uppercase tracking-wide mb-0.5">Plats</p>
                          <p className="text-sm text-[#222222]">{quote.location}</p>
                        </div>
                      )}
                      {quote.cancellation_policy && (
                        <div>
                          <p className="text-xs font-semibold text-[#6A6A6A] uppercase tracking-wide mb-0.5">Avbokning</p>
                          <p className="text-sm text-[#222222]">{quote.cancellation_policy}</p>
                        </div>
                      )}
                    </div>
                    {quote.description && (
                      <div className="px-5 py-4 border-b border-[#EBEBEB]">
                        <p className="text-xs font-semibold text-[#6A6A6A] uppercase tracking-wide mb-1">Vad ingår</p>
                        <p className="text-sm text-[#222222] leading-relaxed">{quote.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-5 py-4">
                      {quote.status === 'pending' && isPlanner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuoteResponse(quote.id, 'declined')}
                            disabled={respondingToQuote === quote.id}
                            className="flex-1 rounded-xl border border-[#EBEBEB] py-2.5 text-xs font-medium text-[#6A6A6A] hover:bg-[#F2F2F2] transition-colors disabled:opacity-40"
                          >
                            Avböj
                          </button>
                          <button
                            onClick={() => handleQuoteResponse(quote.id, 'accepted')}
                            disabled={respondingToQuote === quote.id}
                            className="flex-1 rounded-xl bg-[#1D9E75] py-2.5 text-xs font-semibold text-white hover:bg-[#178a65] transition-colors disabled:opacity-40"
                          >
                            {respondingToQuote === quote.id ? '...' : 'Acceptera offert →'}
                          </button>
                        </div>
                      )}
                      {quote.status === 'pending' && !isPlanner && (
                        <p className="text-xs text-[#6A6A6A] text-center">Väntar på svar från {otherName}...</p>
                      )}
                      {quote.status === 'accepted' && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#1D9E75]" />
                          <p className="text-xs font-semibold text-[#1D9E75]">Offert accepterad — betalning väntar</p>
                        </div>
                      )}
                      {quote.status === 'declined' && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#6A6A6A]" />
                          <p className="text-xs text-[#6A6A6A]">Offert avböjd</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#C0C0C0] mt-2">
                    {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )
            }

            // Regular message
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 w-8">
                  {showSender && (
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isMe ? 'bg-[#222222] text-white' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                    }`}>
                      {isMe ? 'Du' : initial1}
                    </div>
                  )}
                </div>

                <div className={`max-w-[65%] space-y-1 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showSender && (
                    <p className="text-xs font-medium text-[#6A6A6A] px-1">
                      {isMe ? 'Du' : otherName}
                    </p>
                  )}

                  {msg.image_url && (
                    <div className="rounded-2xl overflow-hidden">
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <div className="relative w-56 h-56">
                          <Image
                            src={msg.image_url}
                            alt="Bifogad bild"
                            fill
                            className="object-cover hover:opacity-95 transition-opacity"
                            sizes="224px"
                          />
                        </div>
                      </a>
                    </div>
                  )}

                  {msg.content && (
                    <div className={`rounded-2xl px-4 py-3 ${
                      isMe
                        ? 'bg-[#FF6B35] text-white rounded-tr-sm'
                        : 'bg-white text-[#222222] border border-[#EBEBEB] rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}

                  <p className="text-xs text-[#C0C0C0] px-1">
                    {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Completed notice */}
        {isCompleted && (
          <div className="mx-6 mb-6 rounded-2xl bg-[#F2F2F2] border border-[#EBEBEB] px-5 py-3 text-center">
            <p className="text-sm text-[#6A6A6A]">Det här evenemanget är avslutat. Du kan fortfarande läsa konversationen.</p>
          </div>
        )}

        {/* Quote form panel (provider only) */}
        {showQuoteForm && !isCompleted && (
          <div className="bg-white border-t border-[#EBEBEB] px-6 py-5 flex-shrink-0 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSendQuote}>
              <p className="text-sm font-bold text-[#222222] mb-4">Skicka offert</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Price */}
                <div>
                  <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Pris *</label>
                  <div className="relative">
                    <input
                      type="number" min="1" value={quotePrice}
                      onChange={e => setQuotePrice(e.target.value)}
                      placeholder="3 000"
                      className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6A6A6A]">kr</span>
                  </div>
                  {quotePrice && Number(quotePrice) > 0 && (
                    <p className="text-xs text-[#6A6A6A] mt-1">Du får: <span className="font-semibold text-[#1D9E75]">{Math.round(Number(quotePrice) * 0.8).toLocaleString('sv-SE')} kr</span></p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Tid/längd</label>
                  <input
                    type="text" value={quoteDuration}
                    onChange={e => setQuoteDuration(e.target.value)}
                    placeholder="T.ex. 2 timmar"
                    className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Datum</label>
                  <input
                    type="date" value={quoteDate}
                    onChange={e => setQuoteDate(e.target.value)}
                    className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Plats</label>
                  <input
                    type="text" value={quoteLocation}
                    onChange={e => setQuoteLocation(e.target.value)}
                    placeholder="T.ex. Vasastan, Stockholm"
                    className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              {/* What's included */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Vad ingår</label>
                <textarea
                  value={quoteDescription}
                  onChange={e => setQuoteDescription(e.target.value)}
                  placeholder="T.ex. 2 timmars uppträdande, eget ljud och ljus, pauser inkluderade..."
                  rows={2}
                  className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] resize-none"
                />
              </div>

              {/* Cancellation policy */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6A6A6A] mb-1">Avbokningsvillkor</label>
                <select
                  value={quoteCancellation}
                  onChange={e => setQuoteCancellation(e.target.value)}
                  className="w-full rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]"
                >
                  <option>Ingen återbetalning</option>
                  <option>50% återbetalning vid avbokning 7+ dagar innan</option>
                  <option>Full återbetalning vid avbokning 14+ dagar innan</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!quotePrice || Number(quotePrice) < 1 || sendingQuote}
                  className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40"
                >
                  {sendingQuote ? '...' : 'Skicka offert'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowQuoteForm(false); setQuotePrice(''); setQuoteDescription('') }}
                  className="text-xs text-[#6A6A6A] hover:text-[#222222] transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Input */}
        {!isCompleted && !showQuoteForm && (
          <div className="bg-white border-t border-[#EBEBEB] px-6 py-4 flex-shrink-0">
            {suggestedOn && quickReplies.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
                {quickReplies.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setContent(r.body)}
                    className="flex-shrink-0 h-9 px-3.5 rounded-full border border-[#dddddd] bg-white text-[13px] font-medium text-[#222222] hover:bg-[#f2f2f2] transition-colors"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
            {imagePreview && (
              <div className="flex items-start gap-3 mb-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="56px" />
                </div>
                <button type="button" onClick={clearImage}
                  className="text-xs text-[#6A6A6A] hover:text-red-500 transition-colors mt-1">
                  ✕ Ta bort
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-3">
              {/* Image button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 h-10 w-10 rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] flex items-center justify-center text-[#6A6A6A] hover:bg-[#EBEBEB] transition-colors"
                title="Bifoga bild"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
                }}
                placeholder={`Skicka ett meddelande till ${otherName}…`}
                rows={1}
                className="flex-1 rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] px-4 py-2.5 text-sm text-[#222222] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] resize-none transition-colors"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = `${t.scrollHeight}px`
                }}
              />

              {/* Quote button — provider only */}
              {isProvider && (
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(true)}
                  className="flex-shrink-0 h-10 px-4 rounded-xl border border-[#EBEBEB] bg-[#F2F2F2] text-xs font-semibold text-[#222222] hover:bg-[#EBEBEB] transition-colors whitespace-nowrap"
                >
                  + Offert
                </button>
              )}

              <button
                type="submit"
                disabled={(!content.trim() && !imageFile) || sending || uploadProgress}
                className="flex-shrink-0 h-10 px-5 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#e55a26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending || uploadProgress ? '…' : 'Skicka'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
