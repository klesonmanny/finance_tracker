/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f8fafc',
        panel: '#ffffff',
        panelAlt: '#f1f5f9',
        accent: '#16a34a',
        accentSoft: '#15803d',
        warning: '#d97706',
        danger: '#dc2626',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(22, 163, 74, 0.12), 0 12px 32px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
