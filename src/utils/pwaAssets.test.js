/**
 * @jest-environment node
 */

/**
 * Valida que el manifest de la PWA apunte a archivos que existen de verdad
 * (evita regresar al bug original: iconos referenciados que no existían).
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const manifest = require('../../public/manifest.json');

describe('PWA assets', () => {
  test('todos los iconos del manifest existen en public/', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    manifest.icons.forEach((icon) => {
      const filePath = path.join(PUBLIC_DIR, icon.src);
      expect({
        src: icon.src,
        existe: fs.existsSync(filePath)
      }).toEqual({ src: icon.src, existe: true });
    });
  });

  test('los iconos PNG tienen propósito any y maskable definidos', () => {
    const purposes = manifest.icons.map((i) => i.purpose || 'any');
    expect(purposes).toContain('any');
    expect(purposes).toContain('maskable');
  });

  test('manifest declara start_url, scope e id absolutos y display standalone', () => {
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.id).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('es');
  });

  test('existe sw.js y index.html enlaza el manifest', () => {
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'sw.js'))).toBe(true);
    const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
  });
});
