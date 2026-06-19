/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Paleta basada en el logo — teal/aqua del círculo interior */
        tierra: {
          50:  '#f0f8f9',
          100: '#d5ecee',
          200: '#acd8db',
          300: '#7bbdc4',
          400: '#4da3ab',
          500: '#2d8890',
          600: '#1d6e77',
          700: '#155661',
          800: '#0f3f49',
          900: '#092d35',
        },
        /* Verde para indicadores de stock (conservado por claridad UX) */
        naturaleza: {
          50:  '#f2f7f2',
          100: '#e0ecdf',
          200: '#c2d9c0',
          300: '#97bc94',
          400: '#6a9a67',
          500: '#4a7d47',
          600: '#386337',
          700: '#2d4f2c',
          800: '#254025',
          900: '#1e341e',
        },
        /* Rosa del loto — para acentos decorativos */
        loto: {
          50:  '#fef1f6',
          100: '#fbd5e9',
          200: '#f6abd3',
          300: '#ee79b8',
          400: '#e24e9b',
          500: '#ce2d7f',
          600: '#b01e65',
          700: '#8e164e',
          800: '#6c1039',
          900: '#4c0b27',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
