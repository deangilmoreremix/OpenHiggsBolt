import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#d9ff00',
        'primary-hover': '#c4e600',
        accent: '#a855f7',
        'accent-hover': '#9333ea',
        danger: '#ef4444',
        'bg-app': '#050505',
        'bg-panel': '#0a0a0a',
        'bg-card': '#141414',
        'text-primary': '#fff',
        'text-secondary': '#a1a1aa',
        'text-muted': '#52525b',
        'border-color': '#27272a',
        'border-light': '#ffffff1a'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px'
      },
      boxShadow: {
        glow: '0 0 20px #d9ff0066',
        'glow-accent': '0 0 20px #a855f766'
      },
      backdropBlur: {
        glass: '20px'
      }
    }
  },
  plugins: []
} satisfies Config