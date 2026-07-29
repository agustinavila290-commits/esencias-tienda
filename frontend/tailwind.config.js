/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* === Identidad Fase 10 (botánica contemporánea) — tokens semánticos === */
        background: {
          primary:   '#F7F3EA',
          secondary: '#EEE7D9',
        },
        surface: {
          DEFAULT:  '#FFFEFA',
          elevated: '#FFFFFF',
        },
        text: {
          primary:   '#292D29',
          secondary: '#697069',
        },
        brand: {
          primary: {
            50: '#EEF3F0', 100: '#DCE7E0', 200: '#B9CFC1', 300: '#96B7A3',
            400: '#6B9482', 500: '#427059', 600: '#254D3C', 700: '#1D3D30',
            800: '#152C23', 900: '#0D1C16', DEFAULT: '#254D3C',
          },
          secondary: {
            50: '#F3F5F1', 100: '#E4E9E0', 200: '#C9D3C1', 300: '#AEBDA3',
            400: '#97A98D', 500: '#82977B', 600: '#6B7F64', 700: '#55664F',
            800: '#3E4C39', 900: '#283024', DEFAULT: '#82977B',
          },
        },
        accent: {
          50: '#FBF2ED', 100: '#F5E1D5', 200: '#EAC0AB', 300: '#DFA080',
          400: '#D48F6C', 500: '#C87957', 600: '#B5643F', 700: '#925033',
          800: '#6E3C26', 900: '#4A2819', DEFAULT: '#C87957',
        },
        'border-soft': '#DED7CA',
        success: { DEFAULT: '#3F6B51', bg: '#E9F1EB' },
        warning: { DEFAULT: '#A36A35', bg: '#F5EBE0' },
        error:   { DEFAULT: '#A64B40', bg: '#F5E6E4' },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      fontSize: {
        hero: ['clamp(2.375rem, 1.2rem + 4.5vw, 4.25rem)', { lineHeight: '1.08' }],
        h1:   ['clamp(2rem, 1.3rem + 2.6vw, 3.375rem)',    { lineHeight: '1.12' }],
        h2:   ['clamp(1.6rem, 1.2rem + 1.6vw, 2.625rem)',  { lineHeight: '1.16' }],
        h3:   ['clamp(1.35rem, 1.15rem + 0.8vw, 1.75rem)', { lineHeight: '1.25' }],
      },
      maxWidth: {
        site: '1360px',
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(41 45 41 / 0.06), 0 1px 2px -1px rgb(41 45 41 / 0.06)',
        elevated: '0 4px 16px -4px rgb(41 45 41 / 0.12), 0 2px 6px -2px rgb(41 45 41 / 0.08)',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
}
