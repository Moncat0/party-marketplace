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
        ember: {
          DEFAULT: '#FF6B35',
          hover: '#e55a26',
        },
        canvas: '#ffffff',
        foreground: '#222222',
        secondary: '#6a6a6a',
        disabled: '#c1c1c1',
        surface: {
          DEFAULT: '#f2f2f2',
          soft: '#ebebeb',
        },
        divider: '#dddddd',
        success: '#1D9E75',
        // Aliases used in older classnames during migration
        night: '#222222',
        'warm-white': '#ffffff',
      },
      borderRadius: {
        control: '8px',
        card: '12px',
        search: '32px',
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      maxWidth: {
        container: '1200px',
        marketplace: '1760px',
      },
    },
  },
  plugins: [],
}

export default config
