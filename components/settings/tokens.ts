/** Airbnb-inspired settings tokens (VoltAgent Source 1) + FESTEN ember as brand primary. */

export const settingsTokens = {
  colors: {
    primary: '#FF6B35', // FESTEN brand (maps to Source 1 primary role)
    primaryActive: '#e55a26',
    primaryDisabled: '#ffd4c2',
    error: '#c13515',
    errorHover: '#b32505',
    ink: '#222222',
    body: '#3f3f3f',
    muted: '#6a6a6a',
    mutedSoft: '#929292',
    hairline: '#dddddd',
    hairlineSoft: '#ebebeb',
    borderStrong: '#c1c1c1',
    canvas: '#ffffff',
    surfaceSoft: '#f7f7f7',
    surfaceStrong: '#f2f2f2',
    onPrimary: '#ffffff',
    success: '#1D9E75',
  },
  rounded: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    full: '9999px',
  },
  shadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px',
  /**
   * Motion: Source 2 (oh-my-design) documents no reusable motion tokens.
   * Values below follow the build guide's explicit toggle inference (Section 4).
   */
  motion: {
    fast: '160ms',
    easeWarm: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const
