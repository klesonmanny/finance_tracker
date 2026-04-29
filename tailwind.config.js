/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07111d',
        panel: '#0f1b2d',
        panelAlt: '#12233a',
        accent: '#22c55e',
        accentSoft: '#86efac',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34, 197, 94, 0.18), 0 20px 40px rgba(7, 17, 29, 0.5)',
      },
    },
  },
  plugins: [],
};