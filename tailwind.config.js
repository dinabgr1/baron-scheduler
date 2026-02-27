/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'baron-blue': {
          50: '#e6eef8',
          100: '#ccddf1',
          200: '#99bbe3',
          300: '#6699d5',
          400: '#3377c7',
          500: '#0055b9',
          600: '#004494',
          700: '#00336f',
          800: '#00224a',
          900: '#001125',
          950: '#000912',
        },
      },
    },
  },
  plugins: [],
}
