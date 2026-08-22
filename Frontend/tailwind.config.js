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
          50: '#f0f7fc',
          100: '#e0eff9',
          500: '#1769AA',
          600: '#13588f',
          700: '#0f4672',
          DEFAULT: '#1769AA',
        },
        teal: {
          50: '#edfcf8',
          500: '#0F9D8A',
          600: '#0b8272',
          700: '#086357',
          DEFAULT: '#0F9D8A',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#F59E0B',
          600: '#d97706',
          DEFAULT: '#F59E0B',
        },
        canvas: '#F7F9FC',
        surface: '#FFFFFF',
        ink: {
          primary: '#172033',
          secondary: '#667085',
          muted: '#98A2B3',
        },
        borderLight: '#E4E7EC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'card-lg': '16px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 24, 40, 0.05), 0 1px 2px 0 rgba(16, 24, 40, 0.03)',
        'card': '0 4px 6px -1px rgba(16, 24, 40, 0.04), 0 2px 4px -2px rgba(16, 24, 40, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(16, 24, 40, 0.08), 0 4px 6px -4px rgba(16, 24, 40, 0.03)',
        'dropdown': '0 12px 24px -4px rgba(16, 24, 40, 0.12), 0 4px 8px -2px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
}
