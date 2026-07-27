/** Parse User-Agent into Airbnb-style device labels (no extra deps). */

export type DeviceInfo = {
  title: string
  browser: string
  os: string
}

export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  const raw = ua?.trim() || ''
  if (!raw) {
    return { title: 'Okänd enhet', browser: 'Okänd webbläsare', os: 'Okänt system' }
  }

  let browser = 'Webbläsare'
  if (/Edg\//i.test(raw)) browser = 'Edge'
  else if (/Chrome\//i.test(raw) && !/Chromium/i.test(raw)) browser = 'Chrome'
  else if (/Safari\//i.test(raw) && !/Chrome\//i.test(raw)) browser = 'Safari'
  else if (/Firefox\//i.test(raw)) browser = 'Firefox'
  else if (/Opera|OPR\//i.test(raw)) browser = 'Opera'

  let os = 'Okänt system'
  if (/iPhone/i.test(raw)) os = 'iPhone'
  else if (/iPad/i.test(raw)) os = 'iPad'
  else if (/Android/i.test(raw)) os = 'Android'
  else if (/Mac OS X|Macintosh/i.test(raw)) os = 'Mac'
  else if (/Windows/i.test(raw)) os = 'Windows'
  else if (/Linux/i.test(raw)) os = 'Linux'
  else if (/CrOS/i.test(raw)) os = 'ChromeOS'

  const title =
    os === 'iPhone' || os === 'iPad' || os === 'Android'
      ? `${browser} på ${os}`
      : `${browser} på ${os}`

  return { title, browser, os }
}

export function formatSessionTime(iso: string | null | undefined): string {
  if (!iso) return 'Okänd tid'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Okänd tid'

  const now = Date.now()
  const diffMs = now - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 2) return 'Nu'
  if (mins < 60) return `${mins} min sedan`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} tim sedan`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} dagar sedan`

  return d.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getSessionIdFromAccessToken(accessToken: string | undefined): string | null {
  if (!accessToken) return null
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    ) as { session_id?: string }
    return json.session_id ?? null
  } catch {
    return null
  }
}
