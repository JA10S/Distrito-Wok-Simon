import {
  DEFAULT_THEME,
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
