/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kirana: {
          saffron: '#ea580c',
          saffronDark: '#c2410c',
          saffronLight: '#fff7ed',
          jama: '#16a34a',
          jamaDark: '#15803d',
          jamaLight: '#f0fdf4',
          udhaar: '#dc2626',
          udhaarDark: '#b91c1c',
          udhaarLight: '#fef2f2',
          bahi: '#fdfbf7',
          bahiDark: '#f7f2e7',
          ink: '#1c1917',
          muted: '#78716c',
          divider: '#e7e5e4',
          border: '#d6d3d1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Mukta"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'flash-row': 'flashGreen 2.5s ease-out'
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(234, 88, 12, 0.6)' },
          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 24px rgba(234, 88, 12, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(234, 88, 12, 0)' }
        },
        flashGreen: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.35)' },
          '100%': { backgroundColor: 'transparent' }
        }
      }
    },
  },
  plugins: [],
}
