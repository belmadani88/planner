/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // WebThangs brand: deep green, dark teal, soft mint, light gray, white.
        brand: {
          50: '#f0f9f4',
          100: '#dcf1e5',
          200: '#bce4ce',
          300: '#8dd0ae',
          400: '#5ab688',
          500: '#359a6c',
          600: '#267d57',
          700: '#1f6446',
          800: '#1b4d38',
          900: '#163f2f',
          950: '#0a241a'
        },
        teal: {
          950: '#062a2b'
        },
        ink: '#122019',
        paper: '#f5f7f6',
        mist: '#e8efeb',
        accent: '#b45309'
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 36, 26, 0.06), 0 8px 24px -12px rgba(10, 36, 26, 0.18)',
        lifted: '0 2px 4px rgba(10, 36, 26, 0.07), 0 18px 40px -16px rgba(10, 36, 26, 0.25)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both'
      }
    }
  },
  plugins: []
}
