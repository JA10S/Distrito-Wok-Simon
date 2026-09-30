export const DEFAULT_THEME = {
  colors: {
    dorado: '#D4A843',
    doradoClaro: '#F6DE9A',
    doradoOscuro: '#8B6914',
    rojo: '#C40F0F',
    rojoOscuro: '#8B0000',
    negro: '#0d0d0d'
  },
  headingFont: 'cormorant',
  bodyFont: 'montserrat'
};

export const COLOR_FIELDS = [
  { key: 'dorado', label: 'Dorado (principal)' },
  { key: 'doradoClaro', label: 'Dorado claro (textos)' },
  { key: 'doradoOscuro', label: 'Dorado oscuro (bordes)' },
  { key: 'rojo', label: 'Rojo (alertas)' },
  { key: 'rojoOscuro', label: 'Rojo oscuro (hover)' },
  { key: 'negro', label: 'Fondo principal' }
];

export const HEADING_FONTS = [
  { id: 'cormorant', label: 'Cormorant Garamond (elegante)', css: "'Cormorant Garamond', serif" },
  { id: 'playfair', label: 'Playfair Display (clásica)', css: "'Playfair Display', serif" },
  { id: 'lora', label: 'Lora (moderna serif)', css: "'Lora', serif" }
];

export const BODY_FONTS = [
  { id: 'montserrat', label: 'Montserrat (actual)', css: "'Montserrat', sans-serif" },
  { id: 'poppins', label: 'Poppins (redonda)', css: "'Poppins', sans-serif" },
  { id: 'lato', label: 'Lato (suave)', css: "'Lato', sans-serif" }
];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function hexToRgbChannels(hex, fallback) {
  const value = HEX_PATTERN.test(String(hex || '')) ? hex : fallback;
  if (!HEX_PATTERN.test(String(value || ''))) return '0 0 0';
  const int = parseInt(value.slice(1), 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

export function sanitizeTheme(data) {
  const colors = {};
  Object.keys(DEFAULT_THEME.colors).forEach((key) => {
    const candidate = data && data.colors ? data.colors[key] : null;
    colors[key] = HEX_PATTERN.test(String(candidate || '')) ? candidate : DEFAULT_THEME.colors[key];
  });

  const headingFont = HEADING_FONTS.some((f) => f.id === (data && data.headingFont))
    ? data.headingFont
    : DEFAULT_THEME.headingFont;
  const bodyFont = BODY_FONTS.some((f) => f.id === (data && data.bodyFont))
    ? data.bodyFont
    : DEFAULT_THEME.bodyFont;

  return { colors, headingFont, bodyFont };
}

export function applyTheme(theme) {
  const safe = sanitizeTheme(theme);
  const root = document.documentElement;

  Object.entries(safe.colors).forEach(([key, hex]) => {
    const cssVar = `--color-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    root.style.setProperty(cssVar, hexToRgbChannels(hex));
  });

  const heading = HEADING_FONTS.find((f) => f.id === safe.headingFont);
  const body = BODY_FONTS.find((f) => f.id === safe.bodyFont);
  root.style.setProperty('--font-heading', heading.css);
  root.style.setProperty('--font-body', body.css);
}
