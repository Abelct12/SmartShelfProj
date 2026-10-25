/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        sage: {
          50: '#f6f9f6',
          100: '#edf4ee',
          200: '#d8e7da',
          300: '#b6d3bb',
          400: '#8eb996',
          500: '#6c9d75',
          600: '#52805b',
          700: '#416548',
          800: '#36513b',
          900: '#2d4332',
        },
        scientific: {
          primary: '#1b4332',
          secondary: '#2d6a4f',
          accent: '#40916c',
          light: '#d8f3dc',
          canvas: '#f8faf9',
          surface: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
