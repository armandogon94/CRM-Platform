/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
        status: {
          success: 'var(--status-success)',
          pending: 'var(--status-pending)',
          error: 'var(--status-error)',
        },
      },
    },
  },
  plugins: [],
};
