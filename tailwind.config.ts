import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-hanken)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        // Base surfaces
        base: '#0D0D0D',
        surface: '#1A1A1A',
        'surface-high': '#252525',
        'surface-highest': '#2A2A2A',
        border: '#2A2A2A',
        // Accents
        lime: '#CCFF00',
        'lime-dim': '#A8D400',
        pink: '#FF40FF',
        blue: '#00E5FF',
        // Text
        'text-primary': '#E5E2E1',
        'text-secondary': '#8E9192',
        'text-dim': '#555555',
        // Legacy (keep for pages not yet redesigned)
        ember: '#FF6B35',
        night: '#1A1A2E',
        'warm-white': '#FFF8F3',
        success: '#1D9E75',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      maxWidth: {
        container: '1200px',
      },
      backgroundImage: {
        'lime-glow': 'radial-gradient(ellipse at center, rgba(204,255,0,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

export default config
