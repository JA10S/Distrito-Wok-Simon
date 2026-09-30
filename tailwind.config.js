/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dorado': 'rgb(var(--color-dorado) / <alpha-value>)',
        'dorado-claro': 'rgb(var(--color-dorado-claro) / <alpha-value>)',
        'dorado-oscuro': 'rgb(var(--color-dorado-oscuro) / <alpha-value>)',
        'rojo': 'rgb(var(--color-rojo) / <alpha-value>)',
        'rojo-oscuro': 'rgb(var(--color-rojo-oscuro) / <alpha-value>)',
        'negro': 'rgb(var(--color-negro) / <alpha-value>)',
      },
      fontFamily: {
        'cormorant': ['var(--font-heading)', 'serif'],
        'montserrat': ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
