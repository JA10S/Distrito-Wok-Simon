/**
 * Genera los iconos PWA desde public/assets/icons/logo.svg.
 * Usa Puppeteer (ya es dependencia del proyecto) para renderizar el SVG
 * sobre fondo del tema (#0d0d0d) y exportar PNGs listos para el manifest.
 *
 * Uso: node scripts/generate-pwa-icons.js
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'assets', 'icons');
const svg = fs.readFileSync(path.join(ICONS_DIR, 'logo.svg'), 'utf8');

// logoScale 0.6 deja el 20% de padding en cada lado → zona segura maskable
const TARGETS = [
  { file: 'icon-192.png', size: 192, logoScale: 1 },
  { file: 'icon-512.png', size: 512, logoScale: 1 },
  { file: 'maskable-512.png', size: 512, logoScale: 0.6 }
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const target of TARGETS) {
    const { size, logoScale, file } = target;
    const logoSize = Math.round(size * logoScale);

    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(
      `<!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; }
            html, body {
              width: ${size}px;
              height: ${size}px;
              background: #0d0d0d;
              overflow: hidden;
            }
            #wrap {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #wrap svg {
              width: ${logoSize}px;
              height: ${logoSize}px;
              display: block;
            }
          </style>
        </head>
        <body><div id="wrap">${svg}</div></body>
      </html>`,
      { waitUntil: 'load' }
    );

    const outputPath = path.join(ICONS_DIR, file);
    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: size, height: size }
    });
    console.log(`OK ${file} (${size}x${size}, logo ${logoScale * 100}%)`);
  }

  await browser.close();
  console.log('Iconos PWA generados en public/assets/icons/');
})().catch((err) => {
  console.error('Error generando iconos:', err.message);
  process.exitCode = 1;
});
