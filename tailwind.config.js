import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#22d3ee',
          hover: '#06b6d4'
        },
        accent: '#a855f7',
        danger: '#ef4444',
        'bg-app': '#050505',
        'bg-panel': '#0a0a0a',
        'bg-card': '#111111',
        secondary: '#a1a1aa',
        muted: '#52525b',
        'border-color': 'rgba(255,255,255,0.05)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        DEFAULT: '0.75rem'
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 211, 238, 0.4)',
        'glow-accent': '0 0 20px rgba(168, 85, 247, 0.4)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)'
      }
    }
  },
  plugins: []
} satisfies Config