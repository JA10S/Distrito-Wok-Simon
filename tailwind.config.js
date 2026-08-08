/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dorado': '#D4A843',
        'dorado-claro': '#F6DE9A',
        'dorado-oscuro': '#8B6914',
        'rojo': '#C40F0F',
        'rojo-oscuro': '#8B0000',
        'negro': '#0d0d0d',
      },
      fontFamily: {
        'cormorant': ['Cormorant Garamond', 'serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}