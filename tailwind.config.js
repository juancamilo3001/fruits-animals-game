/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        game: {
          amber: '#f59e0b',
          purple: '#8b5cf6',
          coral: '#f43f5e',
          cyan: '#06b6d4',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        }
      },
      animation: {
        'bounce-short': 'bounce 0.8s ease-in-out 2',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
