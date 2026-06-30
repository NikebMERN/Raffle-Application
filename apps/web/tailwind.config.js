/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e40af', dark: '#1e3a8a' },
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
};
