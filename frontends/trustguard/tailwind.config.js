/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EDF2F7',
          100: '#D4DFEC',
          200: '#A9BFD9',
          300: '#7E9FC6',
          400: '#4A90D9',
          500: '#2D5F8A',
          600: '#1E3A5F',
          700: '#182F4D',
          800: '#12243B',
          900: '#0C1929',
        },
      },
    },
  },
  plugins: [],
};
