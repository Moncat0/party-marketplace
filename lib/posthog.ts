import posthog from 'posthog-js'

export function track(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(eventName, properties)
}
