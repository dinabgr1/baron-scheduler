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
        'baron-bg': '#eef0f4',
        'baron-card': '#ffffff',
        'baron-gold': '#c9a961',
        'baron-gold-text': '#a0833a',
        'baron-gold-dim': 'rgba(160,131,58,0.4)',
        'baron-red': '#c23030',
        'baron-text': '#1e2432',
        'baron-muted': 'rgba(30,36,50,0.4)',
        'baron-dim': 'rgba(30,36,50,0.2)',
        'baron-border': 'rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
