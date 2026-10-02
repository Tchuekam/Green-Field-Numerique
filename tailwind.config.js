/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Geist"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
        mono: ['"SF Mono"', '"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        plantation: {
          50: '#F2F8F5',
          100: '#E1EFE8',
          200: '#C2DFD0',
          300: '#95C5AF',
          400: '#62A487',
          500: '#3D8565',
          600: '#2E6B50',
          700: '#265641',
          800: '#214535',
          900: '#1C392C',
          950: '#0C1F16',
        },
        harvest: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        slate: {
          850: '#161B22',
          900: '#0D1117',
          950: '#080C10',
        }
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.2, 0, 0, 1)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        'apple-emphasized': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      boxShadow: {
        'glass-light': '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-dark': '0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'subtle-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 14px rgba(0, 0, 0, 0.03)',
        'modal': '0 24px 64px -12px rgba(0, 0, 0, 0.18), 0 8px 24px -8px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'apple': '20px',
      }
    },
  },
  plugins: [],
}
