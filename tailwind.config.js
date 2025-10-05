/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fedshrim: {
          purple: '#7B2D8E',
          'purple-dark': '#5A1F66',
          'purple-light': '#9B4BAE',
          gold: '#F4C430',
          'gold-dark': '#D4A017',
          'gold-light': '#FFD700',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'cairo': ['Cairo', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
