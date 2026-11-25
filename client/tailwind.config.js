/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          900: '#0A1E33',
          800: '#0F2942',
          700: '#163B5C',
          600: '#1E4E79',
          500: '#2563EB',
          100: '#E8F0F8',
          50: '#F4F7FB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
