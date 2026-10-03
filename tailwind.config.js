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
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--color-surface-3) / <alpha-value>)',
        'ink': 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'line': 'rgb(var(--color-border) / <alpha-value>)',
      },
      fontFamily: {
        'cormorant': ['var(--font-heading)', 'serif'],
        'montserrat': ['var(--font-body)', 'sans-serif'],
        'inter': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
