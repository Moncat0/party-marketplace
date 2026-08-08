/** Airbnb-inspired settings tokens + Festly brand primary (pink). */

export { settingsLayout } from './layout'

export const settingsTokens = {
  colors: {
    primary: '#FF2E8A', // Festly pink
    primaryActive: '#E01F74',
    primaryDisabled: '#FFD0E6',
    error: '#D62B2B',
    errorHover: '#B0165C',
    ink: '#111111',
    body: '#2B2B2B',
    muted: '#5C5C5C',
    mutedSoft: '#9A9A9A',
    hairline: '#DDDDDD',
    hairlineSoft: '#EBEBEB',
    borderStrong: '#C1C1C1',
    canvas: '#FFFFFF',
    surfaceSoft: '#F7F7F7',
    surfaceStrong: '#F2F2F2',
    onPrimary: '#FFFFFF',
    success: '#1F8A52',
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
    easeStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
}
