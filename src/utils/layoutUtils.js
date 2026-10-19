/* Estructura de diseño de la página del menú público.
   Documento Firestore: settings/layout → { blocks: [...] }
   El ORDEN del array es el orden de aparición en la página. */

import React from 'react';
import { GiRiceCooker, GiFrenchFries } from 'react-icons/gi';
import { TbMeat, TbGlass } from 'react-icons/tb';

const MAX_TEXT = 100;

/* Icono de cada categoría (los textos vienen del layout guardado) */
export const SECTION_ICONS = {
  arroces: <GiRiceCooker />,
  corrientes: <TbMeat />,
  porciones: <GiFrenchFries />,
  bebidas: <TbGlass />
};

export const DEFAULT_BLOCKS = [
  {
    id: 'hero',
    kind: 'hero',
    visible: true,
    title: 'DISTRITO WOK SIMÓN',
    slogan: '★ Sabor que enamora ★'
  },
  {
    id: 'arroces',
    kind: 'category',
    visible: true,
    emoji: '🍚',
    label: 'Arroces',
    title: '🍚 Nuestros Arroces',
    subtitle: 'precio · medio / entero'
  },
  {
    id: 'corrientes',
    kind: 'category',
    visible: true,
    emoji: '🍖',
    label: 'Corrientes',
    title: '🍖 Corrientes',
    subtitle: 'platos principales'
  },
  {
    id: 'porciones',
    kind: 'category',
    visible: true,
    emoji: '🍽️',
    label: 'Porciones',
    title: '🍽️ Porciones',
    subtitle: 'acompañamientos'
  },
  {
    id: 'bebidas',
    kind: 'category',
    visible: true,
    emoji: '🥤',
    label: 'Bebidas',
    title: '🥤 Bebidas',
    subtitle: ''
  },
  {
    id: 'footer',
    kind: 'footer',
    visible: true,
    tagline: 'Comida oriental colombiana',
    address: 'Calle Principal #12-34, Simón',
    phone: '(601) 555-0123',
    hours: 'Lun a Dom · 11:00 a.m. – 10:00 p.m.',
    thanks: '¡Gracias por su visita!'
  }
];

export const DEFAULT_LAYOUT = { blocks: DEFAULT_BLOCKS };

export const BLOCK_KIND_LABELS = {
  hero: 'Portada',
  category: 'Categoría',
  footer: 'Footer'
};

/* Campos de texto editables por tipo de bloque */
export const BLOCK_TEXT_FIELDS = {
  hero: [
    { key: 'title', label: 'Título' },
    { key: 'slogan', label: 'Eslogan' }
  ],
  category: [
    { key: 'emoji', label: 'Emoji' },
    { key: 'label', label: 'Nombre en el menú' },
    { key: 'title', label: 'Título de la sección' },
    { key: 'subtitle', label: 'Subtítulo' }
  ],
  footer: [
    { key: 'tagline', label: 'Eslogan' },
    { key: 'address', label: 'Dirección' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'hours', label: 'Horario' },
    { key: 'thanks', label: 'Mensaje de agradecimiento' }
  ]
};

/* Solo 'subtitle' puede quedar vacío (significa "sin subtítulo") */
const EMPTY_ALLOWED = new Set(['subtitle']);

function sanitizeText(value, fallback, allowEmpty) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.slice(0, MAX_TEXT);
  if (!allowEmpty && trimmed.trim() === '') return fallback;
  return trimmed;
}

function sanitizeBlock(candidate, fallback) {
  const fields = BLOCK_TEXT_FIELDS[fallback.kind] || [];
  const block = {
    id: fallback.id,
    kind: fallback.kind,
    visible: candidate.visible !== false
  };
  fields.forEach(({ key }) => {
    block[key] = sanitizeText(candidate[key], fallback[key], EMPTY_ALLOWED.has(key));
  });
  return block;
}

/* Valida cualquier documento guardado y garantiza el shape completo.
   Orden: el del documento para los bloques conocidos; los que falten
   se agregan al final en su orden por defecto; los desconocidos se ignoran. */
export function sanitizeLayout(data) {
  const defaultById = {};
  DEFAULT_BLOCKS.forEach((block) => {
    defaultById[block.id] = block;
  });

  const incoming = data && Array.isArray(data.blocks) ? data.blocks : [];
  const blocks = [];
  const used = new Set();

  incoming.forEach((candidate) => {
    if (!candidate || typeof candidate.id !== 'string') return;
    if (used.has(candidate.id)) return;
    const fallback = defaultById[candidate.id];
    if (!fallback) return;
    blocks.push(sanitizeBlock(candidate, fallback));
    used.add(candidate.id);
  });

  DEFAULT_BLOCKS.forEach((fallback) => {
    if (!used.has(fallback.id)) blocks.push({ ...fallback });
  });

  return { blocks };
}

/* Bloques de categoría visibles, en el orden configurado */
export function getVisibleCategories(layout) {
  const blocks = (layout && Array.isArray(layout.blocks) ? layout.blocks : [])
    .filter((block) => block.kind === 'category' && block.visible !== false);
  return blocks.length > 0
    ? blocks
    : DEFAULT_BLOCKS.filter((block) => block.kind === 'category');
}

/* Bloque por id (hero/footer) con fallback a los valores por defecto */
export function getBlock(layout, id) {
  const fallback = DEFAULT_BLOCKS.find((block) => block.id === id);
  if (!layout || !Array.isArray(layout.blocks)) return fallback;
  return layout.blocks.find((block) => block.id === id) || fallback;
}

/* Mueve un bloque de posición en el array (para drag & drop y botones ↑↓) */
export function moveBlock(blocks, fromIndex, toIndex) {
  if (fromIndex === toIndex) return blocks;
  if (fromIndex < 0 || fromIndex >= blocks.length) return blocks;
  if (toIndex < 0 || toIndex >= blocks.length) return blocks;
  const next = blocks.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
