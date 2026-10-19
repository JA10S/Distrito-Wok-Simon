import {
  DEFAULT_BLOCKS,
  DEFAULT_LAYOUT,
  sanitizeLayout,
  getVisibleCategories,
  getBlock,
  moveBlock,
  BLOCK_TEXT_FIELDS,
  SECTION_ICONS
} from './layoutUtils';

test('sanitizeLayout sin documento devuelve los bloques por defecto', () => {
  const result = sanitizeLayout(null);
  expect(result.blocks).toHaveLength(DEFAULT_BLOCKS.length);
  expect(result.blocks.map((b) => b.id)).toEqual(
    DEFAULT_BLOCKS.map((b) => b.id)
  );
  expect(result.blocks[0]).toEqual(DEFAULT_BLOCKS[0]);
});

test('sanitizeLayout respeta el orden guardado, ignora ids desconocidos y agrega los que falten', () => {
  const result = sanitizeLayout({
    blocks: [
      { id: 'footer', kind: 'footer', visible: false, tagline: 'x', address: 'y', phone: 'z', hours: 'w', thanks: 't' },
      { id: 'inexistente', kind: 'category', visible: true },
      { id: 'porciones', kind: 'category', visible: true, emoji: '🍽️', label: 'Porciones', title: 'T', subtitle: 'S' }
    ]
  });

  expect(result.blocks.map((b) => b.id)).toEqual([
    'footer',
    'porciones',
    'hero',
    'arroces',
    'corrientes',
    'bebidas'
  ]);

  const footer = result.blocks[0];
  expect(footer.visible).toBe(false);
  expect(footer.tagline).toBe('x');
  expect(footer.address).toBe('y');
});

test('sanitizeLayout corrige textos inválidos y permite subtítulo vacío', () => {
  const result = sanitizeLayout({
    blocks: [
      { id: 'hero', kind: 'hero', visible: true, title: '', slogan: 123 },
      { id: 'arroces', kind: 'category', visible: 'no', emoji: '🍚', label: 'Arroz', title: 'Mi Arroz', subtitle: '' },
      ...DEFAULT_BLOCKS.filter((b) => !['hero', 'arroces'].includes(b.id))
    ]
  });

  const hero = result.blocks.find((b) => b.id === 'hero');
  expect(hero.title).toBe('DISTRITO WOK SIMÓN'); // vacío → fallback
  expect(hero.slogan).toBe('★ Sabor que enamora ★'); // no string → fallback

  const arroces = result.blocks.find((b) => b.id === 'arroces');
  expect(arroces.visible).toBe(true); // cualquier valor distinto de false → visible
  expect(arroces.title).toBe('Mi Arroz');
  expect(arroces.subtitle).toBe(''); // vacío permitido en subtitle
});

test('getVisibleCategories devuelve solo categorías visibles en orden', () => {
  const layout = sanitizeLayout({
    blocks: [
      { id: 'bebidas', kind: 'category', visible: true, emoji: '🥤', label: 'Bebidas', title: 'B', subtitle: '' },
      { id: 'arroces', kind: 'category', visible: false, emoji: '🍚', label: 'Arroces', title: 'A', subtitle: '' },
      ...DEFAULT_BLOCKS.filter((b) => !['bebidas', 'arroces'].includes(b.id))
    ]
  });

  const visible = getVisibleCategories(layout);
  expect(visible.map((b) => b.id)).toEqual(['bebidas', 'corrientes', 'porciones']);
});

test('getVisibleCategories con todo oculto cae a las categorías por defecto', () => {
  const layout = sanitizeLayout({
    blocks: DEFAULT_BLOCKS.map((block) =>
      block.kind === 'category' ? { ...block, visible: false } : block
    )
  });

  const visible = getVisibleCategories(layout);
  expect(visible).toHaveLength(4);
  expect(visible.every((b) => b.kind === 'category')).toBe(true);
});

test('getBlock devuelve hero/footer con fallback', () => {
  expect(getBlock(null, 'hero').title).toBe('DISTRITO WOK SIMÓN');
  expect(getBlock(DEFAULT_LAYOUT, 'footer').phone).toBe('(601) 555-0123');
  expect(getBlock(DEFAULT_LAYOUT, 'no-existe')).toBeUndefined();
});

test('moveBlock mueve bloques y valida índices', () => {
  const blocks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  expect(moveBlock(blocks, 0, 1).map((b) => b.id)).toEqual(['b', 'a', 'c']);
  expect(moveBlock(blocks, 2, 0).map((b) => b.id)).toEqual(['c', 'a', 'b']);
  expect(moveBlock(blocks, 1, 1)).toEqual(blocks);
  expect(moveBlock(blocks, -1, 0)).toEqual(blocks);
  expect(moveBlock(blocks, 0, 5)).toEqual(blocks);
});

test('expone campos de texto por bloque e iconos de categoría', () => {
  expect(BLOCK_TEXT_FIELDS.hero.map((f) => f.key)).toEqual(['title', 'slogan']);
  expect(BLOCK_TEXT_FIELDS.category.map((f) => f.key)).toEqual([
    'emoji',
    'label',
    'title',
    'subtitle'
  ]);
  expect(BLOCK_TEXT_FIELDS.footer).toHaveLength(5);
  expect(Object.keys(SECTION_ICONS)).toEqual([
    'arroces',
    'corrientes',
    'porciones',
    'bebidas'
  ]);
});
