import {
  DEFAULT_THEME,
  PRESETS,
  COLOR_KEYS,
  MODES,
  LAYOUTS,
  RADII,
  getPalette,
  resolveMode,
  hexToRgbChannels,
  sanitizeTheme,
  applyTheme
} from './themeUtils';

describe('hexToRgbChannels', () => {
  test('convierte hex a canales rgb', () => {
    expect(hexToRgbChannels('#D4A843')).toBe('212 168 67');
    expect(hexToRgbChannels('#0d0d0d')).toBe('13 13 13');
    expect(hexToRgbChannels('#FFFFFF')).toBe('255 255 255');
  });

  test('usa el fallback con hex inválido', () => {
    expect(hexToRgbChannels('no-es-hex', '#D4A843')).toBe('212 168 67');
    expect(hexToRgbChannels('#12345', '#FF0000')).toBe('255 0 0');
  });

  test('retorna negro sin valor válido', () => {
    expect(hexToRgbChannels(null)).toBe('0 0 0');
  });
});

describe('sanitizeTheme', () => {
  test('sin datos retorna el tema por defecto', () => {
    expect(sanitizeTheme(null)).toEqual(DEFAULT_THEME);
    expect(sanitizeTheme(undefined)).toEqual(DEFAULT_THEME);
  });

  test('conserva valores válidos y descarta inválidos', () => {
    const result = sanitizeTheme({
      colors: { dorado: '#112233', rojo: 'invalido' },
      headingFont: 'playfair',
      bodyFont: 'noexiste'
    });

    expect(result.colors.dorado).toBe('#112233');
    expect(result.colors.rojo).toBe(DEFAULT_THEME.colors.rojo);
    expect(result.headingFont).toBe('playfair');
    expect(result.bodyFont).toBe(DEFAULT_THEME.bodyFont);
  });

  test('siempre incluye todos los colores', () => {
    const result = sanitizeTheme({ colors: {} });
    expect(Object.keys(result.colors).sort()).toEqual(
      Object.keys(DEFAULT_THEME.colors).sort()
    );
  });
});

describe('applyTheme', () => {
  let setPropertySpy;

  beforeEach(() => {
    setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
  });

  afterEach(() => {
    setPropertySpy.mockRestore();
  });

  test('aplica variables CSS en el documento', () => {
    applyTheme({
      colors: { ...DEFAULT_THEME.colors, dorado: '#112233' },
      headingFont: 'lora',
      bodyFont: 'poppins'
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--color-dorado', '17 34 51');
    expect(setPropertySpy).toHaveBeenCalledWith('--color-negro', '13 13 13');
    expect(setPropertySpy).toHaveBeenCalledWith('--font-heading', expect.stringContaining('Lora'));
    expect(setPropertySpy).toHaveBeenCalledWith('--font-body', expect.stringContaining('Poppins'));
  });

  test('no lanza errores con datos corruptos', () => {
    expect(() => applyTheme({ colors: { dorado: 'xxx' }, headingFont: 42 })).not.toThrow();
    expect(setPropertySpy).toHaveBeenCalledWith('--color-dorado', '212 168 67');
    expect(setPropertySpy).toHaveBeenCalledWith('--font-heading', expect.stringContaining('Cormorant'));
  });
});

describe('presets y paletas', () => {
  test('hay 3 estilos y cada uno define modo oscuro y claro completos', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(['clasico', 'jade', 'carmesi']);

    PRESETS.forEach((preset) => {
      COLOR_KEYS.forEach((key) => {
        expect(preset.dark[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.light[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
      expect(preset.fonts.headingFont).toBeTruthy();
      expect(preset.fonts.bodyFont).toBeTruthy();
    });
  });

  test('getPalette devuelve la paleta del modo pedido', () => {
    expect(getPalette('jade', 'light').surface).toBe('#F4FAF7');
    expect(getPalette('jade', 'dark').surface).toBe('#0A1311');
    expect(getPalette('noexiste', 'dark')).toEqual(getPalette('clasico', 'dark'));
  });

  test('las opciones de modo, disposición y esquinas están completas', () => {
    expect(MODES.map((m) => m.id)).toEqual(['dark', 'light', 'system']);
    expect(LAYOUTS.map((l) => l.id)).toEqual(['clasic', 'hamburger', 'side']);
    expect(RADII.map((r) => r.id)).toEqual(['sm', 'md', 'lg']);
  });
});

describe('sanitizeTheme con modo, disposición y esquinas', () => {
  test('acepta valores válidos', () => {
    const result = sanitizeTheme({ preset: 'jade', mode: 'light', layout: 'side', radius: 'lg' });
    expect(result).toMatchObject({ preset: 'jade', mode: 'light', layout: 'side', radius: 'lg' });
    expect(result.colors.surface).toBe(getPalette('jade', 'light').surface);
  });

  test('descarta valores inválidos', () => {
    const result = sanitizeTheme({ preset: 'otro', mode: 'sepia', layout: 'grid', radius: 'xl' });
    expect(result).toMatchObject({
      preset: DEFAULT_THEME.preset,
      mode: DEFAULT_THEME.mode,
      layout: DEFAULT_THEME.layout,
      radius: DEFAULT_THEME.radius
    });
  });
});

describe('resolveMode', () => {
  test('usa el modo guardado si no es system', () => {
    expect(resolveMode({ mode: 'light' })).toBe('light');
    expect(resolveMode({ mode: 'dark' })).toBe('dark');
  });

  test('con system sigue la preferencia del sistema', () => {
    const matches = jest.fn().mockReturnValue(true);
    const original = window.matchMedia;
    window.matchMedia = jest.fn(() => ({ matches }));

    expect(resolveMode({ mode: 'system' })).toBe('light');
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: light)');

    window.matchMedia = original;
  });
});

describe('applyTheme: modo, disposición y esquinas', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-mode');
    document.documentElement.removeAttribute('data-layout');
    document.documentElement.removeAttribute('data-radius');
  });

  test('escribe el dataset y la paleta oscura de respaldo', () => {
    applyTheme({ mode: 'light', layout: 'hamburger', radius: 'lg' });

    expect(document.documentElement.dataset.mode).toBe('light');
    expect(document.documentElement.dataset.layout).toBe('hamburger');
    expect(document.documentElement.dataset.radius).toBe('lg');

    const styles = document.documentElement.style;
    expect(styles.getPropertyValue('--dk-dorado').trim()).toBe('212 168 67');
    expect(styles.getPropertyValue('--color-dorado').trim()).toBe('150 115 26');
    expect(styles.getPropertyValue('--gold-mid').trim()).not.toBe('');
  });

  test('con el modo forzado al contrario usa la paleta de ese modo (no la guardada)', () => {
    const guardado = { mode: 'dark', colors: { ...DEFAULT_THEME.colors } };

    applyTheme(guardado, 'light');
    expect(document.documentElement.dataset.mode).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--color-surface').trim()).toBe('250 246 236');

    applyTheme(guardado, 'dark');
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--color-surface').trim()).toBe('13 13 13');
  });
});
