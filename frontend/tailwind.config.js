/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F4F3EE',
        surface: '#FFFFFF',
        'surface-secondary': '#EDE9DF',
        accent: '#C15F3C',
        'accent-surface': '#FFF3EA',
        text: '#26211D',
        'text-secondary': '#6B6560',
        muted: '#B1ADA1',
        border: '#E8E4DC',
        'border-subtle': '#F0EDE6',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '28px',
        pill: '9999px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(38, 33, 29, 0.04), 0 1px 2px rgba(38, 33, 29, 0.02)',
        'card': '0 4px 20px rgba(38, 33, 29, 0.04)',
        'glow': '0 0 20px rgba(193, 95, 60, 0.12)',
        'nav': '0 4px 24px rgba(38, 33, 29, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
