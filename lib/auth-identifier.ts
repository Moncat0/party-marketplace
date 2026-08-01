export type IdentifierKind = 'email' | 'phone' | 'unknown'

export type CountryDial = {
  code: string
  dial: string
  label: string
}

/** Common dial codes; Sweden first (default). */
export const COUNTRY_DIALS: CountryDial[] = [
  { code: 'SE', dial: '+46', label: 'Sverige' },
  { code: 'NO', dial: '+47', label: 'Norge' },
  { code: 'DK', dial: '+45', label: 'Danmark' },
  { code: 'FI', dial: '+358', label: 'Finland' },
  { code: 'DE', dial: '+49', label: 'Tyskland' },
  { code: 'GB', dial: '+44', label: 'Storbritannien' },
  { code: 'US', dial: '+1', label: 'USA' },
  { code: 'ES', dial: '+34', label: 'Spanien' },
  { code: 'FR', dial: '+33', label: 'Frankrike' },
]

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Detect whether the combined field looks like email or phone.
 * Letters / @ → email. Digits (with phone punctuation) → phone.
 */
export function detectIdentifierKind(raw: string): IdentifierKind {
  const value = raw.trim()
  if (!value) return 'unknown'

  if (value.includes('@') || /[a-zA-Z]/.test(value)) {
    return 'email'
  }

  const digits = value.replace(/\D/g, '')
  if (digits.length >= 1) return 'phone'

  return 'unknown'
}

/** National number → E.164 using selected dial code. */
export function toE164(dial: string, national: string): string {
  const trimmed = national.trim()
  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`
  }

  let digits = trimmed.replace(/\D/g, '')
  const dialDigits = dial.replace(/\D/g, '')

  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 4) {
    return `+${digits}`
  }

  // Local Swedish-style leading 0
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return `+${dialDigits}${digits}`
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

/**
 * Split a stored E.164 value into dial + national digits for edit UIs.
 * Falls back to Sweden (+46) when the prefix is unknown.
 */
export function parseE164ToDialAndNational(e164: string): {
  dial: string
  national: string
} {
  const digits = e164.trim().replace(/\D/g, '')
  if (!digits) {
    return { dial: COUNTRY_DIALS[0].dial, national: '' }
  }

  const sorted = [...COUNTRY_DIALS].sort(
    (a, b) => b.dial.replace(/\D/g, '').length - a.dial.replace(/\D/g, '').length
  )

  for (const country of sorted) {
    const dialDigits = country.dial.replace(/\D/g, '')
    if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
      return { dial: country.dial, national: digits.slice(dialDigits.length) }
    }
  }

  return { dial: COUNTRY_DIALS[0].dial, national: digits }
}

/** Human-readable E.164 for settings rows (e.g. +46 76 123 45 67). */
export function formatPhoneDisplay(e164: string): string {
  const trimmed = e164.trim()
  if (!trimmed || !isValidE164(trimmed)) return trimmed

  const { dial, national } = parseE164ToDialAndNational(trimmed)
  if (!national) return dial

  if (dial === '+46' && national.length === 9) {
    return `${dial} ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 7)} ${national.slice(7)}`
  }

  return `${dial} ${national}`
}
