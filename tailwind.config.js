/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fedshi: {
          purple: '#4B0082',
          yellow: '#FFD700',
          'purple-dark': '#3A0066',
          'yellow-dark': '#E6C200',
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
