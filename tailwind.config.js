/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sebrae: {
          orange: '#FF6B00',
          orangeLight: '#FF8C3A',
          orangeDark: '#E05A00',
          blue: '#005A9C',
          blueLight: '#E8F0FE',
              azul: '#2A4FDA',
    azulGradiente: 'linear-gradient(135deg, #2A4FDA 0%, #005A9C 100%)',
          blueDark: '#003D6B',
          dark: {
            bg: '#0F172A',
            card: '#1E293B',
            border: '#334155',
            text: '#E2E8F0',
            textMuted: '#94A3B8',
          },
          light: {
            bg: '#F8FAFC',
            card: '#FFFFFF',
            border: '#E2E8F0',
            text: '#0F172A',
            textMuted: '#64748B',
                azul: '#2A4FDA',
    azulGradiente: 'linear-gradient(135deg, #2A4FDA 0%, #005A9C 100%)',
          }
        }
        
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sebrae': '0 4px 14px 0 rgba(0, 90, 156, 0.15)',
        'sebrae-lg': '0 8px 30px 0 rgba(0, 90, 156, 0.2)',
        'sebrae-dark': '0 4px 14px 0 rgba(0, 0, 0, 0.3)',
        'sebrae-lg-dark': '0 8px 30px 0 rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
