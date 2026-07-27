'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Cross-card wishlist heart state.
 * The same provider can appear in multiple rows / remount on filter changes —
 * without a shared store the heart flickers back to empty after a successful save.
 */
const savedIds = new Set<string>()
const listeners = new Map<string, Set<() => void>>()

function emit(providerId: string) {
  listeners.get(providerId)?.forEach(l => l())
}

export function markWishlistSaved(providerId: string) {
  if (savedIds.has(providerId)) {
    emit(providerId)
    return
  }
  savedIds.add(providerId)
  emit(providerId)
}

export function markWishlistUnsaved(providerId: string) {
  if (!savedIds.has(providerId)) {
    emit(providerId)
    return
  }
  savedIds.delete(providerId)
  emit(providerId)
}

export function useProviderWishlistSaved(providerId: string, initialSaved = false) {
  const [saved, setSaved] = useState(
    () => savedIds.has(providerId) || initialSaved
  )

  useEffect(() => {
    if (initialSaved) savedIds.add(providerId)
    setSaved(savedIds.has(providerId))

    let set = listeners.get(providerId)
    if (!set) {
      set = new Set()
      listeners.set(providerId, set)
    }
    const onChange = () => setSaved(savedIds.has(providerId))
    set.add(onChange)
    return () => {
      set!.delete(onChange)
      if (set!.size === 0) listeners.delete(providerId)
    }
  }, [providerId, initialSaved])

  const markSaved = useCallback(() => {
    markWishlistSaved(providerId)
  }, [providerId])

  const markUnsaved = useCallback(() => {
    markWishlistUnsaved(providerId)
  }, [providerId])

  return { saved, markSaved, markUnsaved }
}
