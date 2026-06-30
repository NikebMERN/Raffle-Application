/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Royal-blue brand. DEFAULT/dark kept for backward-compatible `bg-primary`.
        primary: {
          DEFAULT: '#1e40af',
          dark: '#1e3a8a',
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3cdff',
          300: '#84acff',
          400: '#5285fb',
          500: '#2f63f0',
          600: '#1e4fd6',
          700: '#1e40af',
          800: '#1c3a93',
          900: '#1b3478',
          950: '#13214a',
        },
        // Gold/amber accent for CTAs and highlights.
        accent: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        'card-hover': '0 14px 36px -14px rgba(30,64,175,0.30)',
        glow: '0 10px 34px -10px rgba(30,64,175,0.45)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(1rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .4s ease-out both',
        'slide-up': 'slide-up .5s cubic-bezier(.21,1.02,.73,1) both',
        'slide-in': 'slide-in .25s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
