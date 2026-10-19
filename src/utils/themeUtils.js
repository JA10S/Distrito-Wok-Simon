const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/* ============================================================
   Paletas: 3 estilos (presets) x 2 modos (dark / light).
   `dorado` es SIEMPRE el acento (botones con texto oscuro),
   `doradoClaro` es el color de texto principal,
   `doradoOscuro` es el texto atenuado / borde / hover.
   ============================================================ */
export const PRESETS = [
  {
    id: 'clasico',
    name: 'Clásico Dorado',
    description: 'Dorado y rojo sobre negro. La identidad original del restaurante.',
    fonts: { headingFont: 'cormorant', bodyFont: 'montserrat' },
    dark: {
      dorado: '#D4A843',
      doradoClaro: '#F6DE9A',
      doradoOscuro: '#8B6914',
      rojo: '#C40F0F',
      rojoOscuro: '#8B0000',
      negro: '#0d0d0d',
      surface: '#0d0d0d',
      surface2: '#17171A',
      surfaceCard: '#17171A',
      surfaceHero: '#17171A',
      surfaceHeader: '#0d0d0d',
      surfaceFooter: '#17171A',
      surface3: '#232327',
      ink: '#FFFFFF',
      inkMuted: '#A99767',
      border: '#46391F'
    },
    /* Modo diurno: inversión cálida del nocturno (fondo claro, texto oscuro).
       `dorado` queda tostado/legible para textos; el CREMA se aplica en el
       degradado de botones y acentos vía applyTheme (mix con crema). */
    light: {
      dorado: '#967A24',
      doradoClaro: '#3E3313',
      doradoOscuro: '#8B6914',
      rojo: '#B0121A',
      rojoOscuro: '#8B0A10',
      negro: '#16130E',
      surface: '#F2F0E9',
      surface2: '#FBFAF6',
      surfaceCard: '#FBFAF6',
      surfaceHero: '#FBFAF6',
      surfaceHeader: '#F2F0E9',
      surfaceFooter: '#FBFAF6',
      surface3: '#E9E6DB',
      ink: '#16130E',
      inkMuted: '#6D6350',
      border: '#D8D3C2'
    }
  },
  {
    id: 'jade',
    name: 'Jade Oriental',
    description: 'Verde jade y marfil. Minimalista, fresco y contemporáneo.',
    fonts: { headingFont: 'playfair', bodyFont: 'poppins' },
    dark: {
      dorado: '#46C09A',
      doradoClaro: '#DCF3EA',
      doradoOscuro: '#1F6E58',
      rojo: '#E2574C',
      rojoOscuro: '#A6332B',
      negro: '#0A1311',
      surface: '#0A1311',
      surface2: '#10201C',
      surfaceCard: '#10201C',
      surfaceHero: '#10201C',
      surfaceHeader: '#0A1311',
      surfaceFooter: '#10201C',
      surface3: '#17302B',
      ink: '#FFFFFF',
      inkMuted: '#96C4B4',
      border: '#245347'
    },
    light: {
      dorado: '#1F8A6B',
      doradoClaro: '#10312A',
      doradoOscuro: '#1E7F63',
      rojo: '#C4392F',
      rojoOscuro: '#97271F',
      negro: '#0E1B17',
      surface: '#F4FAF7',
      surface2: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceHero: '#FFFFFF',
      surfaceHeader: '#F4FAF7',
      surfaceFooter: '#FFFFFF',
      surface3: '#E7F2EC',
      ink: '#0E1B17',
      inkMuted: '#4F635B',
      border: '#D5E6DE'
    }
  },
  {
    id: 'carmesi',
    name: 'Carmesí Noche',
    description: 'Terracota y arena. Cálido, rústico y con carácter.',
    fonts: { headingFont: 'lora', bodyFont: 'lato' },
    dark: {
      dorado: '#E0674F',
      doradoClaro: '#FBE7DF',
      doradoOscuro: '#A8412F',
      rojo: '#C41E1E',
      rojoOscuro: '#7E1414',
      negro: '#120C0A',
      surface: '#120C0A',
      surface2: '#1C1310',
      surfaceCard: '#1C1310',
      surfaceHero: '#1C1310',
      surfaceHeader: '#120C0A',
      surfaceFooter: '#1C1310',
      surface3: '#2A1C18',
      ink: '#FFFFFF',
      inkMuted: '#CBA89A',
      border: '#5A342A'
    },
    light: {
      dorado: '#C0523F',
      doradoClaro: '#3F1C15',
      doradoOscuro: '#B84E3B',
      rojo: '#B0121A',
      rojoOscuro: '#8B0A10',
      negro: '#1E1310',
      surface: '#FCF5F1',
      surface2: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceHero: '#FFFFFF',
      surfaceHeader: '#FCF5F1',
      surfaceFooter: '#FFFFFF',
      surface3: '#F6E9E2',
      ink: '#1E1310',
      inkMuted: '#6E5850',
      border: '#EEDCD3'
    }
  }
];

export const COLOR_KEYS = Object.keys(PRESETS[0].dark);

export const MODES = [
  { id: 'dark', label: 'Nocturno', icon: '🌙' },
  { id: 'light', label: 'Diurno', icon: '☀️' },
  { id: 'system', label: 'Sistema', icon: '💻' }
];

export const LAYOUTS = [
  {
    id: 'clasic',
    label: 'Clásica',
    description: 'Menú lateral por categorías en escritorio y pills al estilo actual.'
  },
  {
    id: 'hamburger',
    label: 'Hamburguesa',
    description: 'Barra compacta con menú deslizante y platos en tarjetas a dos columnas.'
  },
  {
    id: 'side',
    label: 'Menú lateral',
    description: 'Navegación lateral fija en escritorio; en móvil se abre con hamburguesa.'
  }
];

export const RADII = [
  { id: 'sm', label: 'Esquinas rectas' },
  { id: 'md', label: 'Esquinas suaves' },
  { id: 'lg', label: 'Esquinas redondeadas' }
];

export const getPalette = (presetId, mode) => {
  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  return { ...preset[mode === 'light' ? 'light' : 'dark'] };
};

export const DEFAULT_THEME = {
  preset: 'clasico',
  mode: 'dark',
  layout: 'clasic',
  radius: 'md',
  colors: getPalette('clasico', 'dark'),
  headingFont: 'cormorant',
  bodyFont: 'montserrat'
};

export const COLOR_FIELDS = [
  { key: 'dorado', label: 'Dorado (principal)', group: 'accent' },
  { key: 'doradoClaro', label: 'Dorado claro (textos)', group: 'accent' },
  { key: 'doradoOscuro', label: 'Dorado oscuro (bordes)', group: 'accent' },
  { key: 'rojo', label: 'Rojo (alertas)', group: 'accent' },
  { key: 'rojoOscuro', label: 'Rojo oscuro (hover)', group: 'accent' },
  { key: 'negro', label: 'Fondo principal', group: 'accent' },
  { key: 'surface', label: 'Fondo de página', group: 'surface' },
  { key: 'surface2', label: 'Fondo de tarjetas', group: 'surface' },
  { key: 'surfaceCard', label: 'Fondo de tarjetas destacadas (mesas, resúmenes, últimos pedidos)', group: 'surface' },
  { key: 'surfaceHeader', label: 'Fondo de barra superior', group: 'surface' },
  { key: 'surfaceHero', label: 'Fondo de portada (menú)', group: 'surface' },
  { key: 'surfaceFooter', label: 'Fondo del pie', group: 'surface' },
  { key: 'surface3', label: 'Fondo de campos', group: 'surface' },
  { key: 'ink', label: 'Texto principal', group: 'surface' },
  { key: 'inkMuted', label: 'Texto secundario', group: 'surface' },
  { key: 'border', label: 'Bordes', group: 'surface' }
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

export function hexToRgbChannels(hex, fallback) {
  const value = HEX_PATTERN.test(String(hex || '')) ? hex : fallback;
  if (!HEX_PATTERN.test(String(value || ''))) return '0 0 0';
  const int = parseInt(value.slice(1), 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

/* Mezcla hex con un color objetivo (para el crema del modo diurno) */
function mixWith(hex, targetHex, ratio) {
  if (!HEX_PATTERN.test(String(hex || ''))) return targetHex;
  const int = parseInt(hex.slice(1), 16);
  const tInt = parseInt(targetHex.slice(1), 16);
  const channel = (shift) => {
    const value = (int >> shift) & 255;
    const target = (tInt >> shift) & 255;
    const mixed = Math.round(value + (target - value) * ratio);
    return mixed.toString(16).padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/* Crema del modo diurno: el acento se aclara hacia crema para botones */
const CREAM = '#FFF6DB';

const isValidHex = (value) => HEX_PATTERN.test(String(value || ''));

export function sanitizeTheme(data) {
  const preset = PRESETS.find((p) => p.id === (data && data.preset));
  const presetId = preset ? preset.id : DEFAULT_THEME.preset;

  const mode = ['dark', 'light', 'system'].includes(data && data.mode)
    ? data.mode
    : DEFAULT_THEME.mode;

  const layout = LAYOUTS.some((l) => l.id === (data && data.layout))
    ? data.layout
    : DEFAULT_THEME.layout;

  const radius = RADII.some((r) => r.id === (data && data.radius))
    ? data.radius
    : DEFAULT_THEME.radius;

  const base = getPalette(presetId, mode === 'light' ? 'light' : 'dark');
  const colors = {};
  COLOR_KEYS.forEach((key) => {
    const candidate = data && data.colors ? data.colors[key] : null;
    colors[key] = isValidHex(candidate) ? candidate : base[key];
  });

  const headingFont = HEADING_FONTS.some((f) => f.id === (data && data.headingFont))
    ? data.headingFont
    : DEFAULT_THEME.headingFont;
  const bodyFont = BODY_FONTS.some((f) => f.id === (data && data.bodyFont))
    ? data.bodyFont
    : DEFAULT_THEME.bodyFont;

  return { preset: presetId, mode, layout, radius, colors, headingFont, bodyFont };
}

export function resolveMode(theme) {
  const saved = sanitizeTheme(theme).mode;
  if (saved !== 'system') return saved;
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch (error) {
      return 'dark';
    }
  }
  return 'dark';
}

/* Fuentes adicionales de Google Fonts: se descargan solo si el tema las usa,
   para no bloquear la primera carga con las 7 familias. */
const FONT_SPECS = {
  Cormorant_Garamond:
    'family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400',
  Playfair_Display: 'family=Playfair+Display:wght@400;600;700',
  Lora: 'family=Lora:wght@400;600',
  Montserrat: 'family=Montserrat:wght@300;400;500;600',
  Poppins: 'family=Poppins:wght@300;400;500;600',
  Lato: 'family=Lato:wght@300;400;700'
};

export function ensureFontLoaded(fontCss) {
  if (typeof document === 'undefined' || !fontCss) return;
  const match = /^'([^']+)'/.exec(String(fontCss).trim());
  if (!match) return;
  const key = match[1].replace(/\s+/g, '_');
  const spec = FONT_SPECS[key];
  if (!spec) return;
  const selector = `link[data-theme-font="${match[1]}"]`;
  if (document.querySelector(selector)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${spec}&display=swap`;
  link.setAttribute('data-theme-font', match[1]);
  document.head.appendChild(link);
}

export function applyTheme(theme, modeOverride) {
  const safe = sanitizeTheme(theme);
  const root = document.documentElement;
  /* Modo al que pertenecen los colores personalizados guardados */
  const savedMode = safe.mode === 'system' ? resolveMode(safe) : safe.mode;

  /* Modo que se va a aplicar (el visitante puede forzar dark/light) */
  const effectiveMode =
    modeOverride === 'light' || modeOverride === 'dark' ? modeOverride : resolveMode(safe);

  /* Si el modo aplicado es distinto al guardado, los colores personalizados
     ya no corresponden: se usa la paleta del preset para el modo pedido. */
  const colors =
    effectiveMode === savedMode ? safe.colors : getPalette(safe.preset, effectiveMode);

  Object.entries(colors).forEach(([key, hex]) => {
    const cssVar = `--color-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    root.style.setProperty(cssVar, hexToRgbChannels(hex));
  });

  /* Paleta oscura: se expone con prefijo --dk- para que las secciones
     fijamente oscuras (hero del login) no cambien con el modo. */
  const darkPalette = savedMode === 'dark' ? safe.colors : getPalette(safe.preset, 'dark');
  Object.entries(darkPalette).forEach(([key, hex]) => {
    const cssVar = `--dk-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    root.style.setProperty(cssVar, hexToRgbChannels(hex));
  });

  const heading = HEADING_FONTS.find((f) => f.id === safe.headingFont);
  const body = BODY_FONTS.find((f) => f.id === safe.bodyFont);
  ensureFontLoaded(heading.css);
  ensureFontLoaded(body.css);
  root.style.setProperty('--font-heading', heading.css);
  root.style.setProperty('--font-body', body.css);

  /* Degradado del botón dorado: en modo claro el acento se mezcla con CREMA
     (no blanco puro) para que los botones/decoración queden dorado crema
     con texto oscuro legible encima. */
  const accent = colors.dorado;
  if (effectiveMode === 'light') {
    root.style.setProperty('--gold-from', mixWith(accent, CREAM, 0.88));
    root.style.setProperty('--gold-mid', mixWith(accent, CREAM, 0.72));
    root.style.setProperty('--gold-to', mixWith(accent, CREAM, 0.42));
  } else {
    root.style.setProperty('--gold-from', colors.doradoClaro);
    root.style.setProperty('--gold-mid', colors.dorado);
    root.style.setProperty('--gold-to', colors.doradoOscuro);
  }

  root.dataset.mode = effectiveMode;
  root.dataset.layout = safe.layout;
  root.dataset.radius = safe.radius;

  /* Barra del navegador (móvil): sigue el fondo del tema activo */
  try {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', colors.surface);
  } catch (error) {
    /* entornos sin document.head */
  }
}
