/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        'baron-bg': '#f5f3ef',
        'baron-card': '#ffffff',
        'baron-gold': '#b8912d',
        'baron-gold-light': '#d4b85a',
        'baron-gold-text': '#8a6d1b',
        'baron-gold-dim': 'rgba(184,145,45,0.3)',
        'baron-red': '#c23030',
        'baron-dark': '#1a1e2e',
        'baron-text': '#1e2432',
        'baron-muted': 'rgba(30,36,50,0.5)',
        'baron-dim': 'rgba(30,36,50,0.2)',
        'baron-border': 'rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
