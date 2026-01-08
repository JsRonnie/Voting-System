/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Chivo"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        surface: '#070c1c',
        accent: '#ffb347',
        brand: {
          100: '#f2f5ff',
          200: '#d7deff',
          300: '#a5b5ff',
          400: '#6a7dff',
          500: '#3c4dff',
          600: '#2a33d3',
          700: '#1d24a8',
          800: '#141a7c',
          900: '#090f44',
        },
        success: '#00c389',
        warning: '#ffbf3c',
        danger: '#ff5c75',
      },
      boxShadow: {
        glass: '0 20px 45px rgba(17, 23, 70, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease forwards',
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at 20% 20%, rgba(255, 179, 71, 0.2), transparent 60%), radial-gradient(circle at 80% 0%, rgba(58, 77, 255, 0.25), transparent 45%)',
      },
    },
  },
  plugins: [],
}
