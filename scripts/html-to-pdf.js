const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const htmlPath = path.join(__dirname, '..', 'temp-menu.html');
  const pdfPath = path.join(__dirname, '..', 'archive', 'pdfs', 'menu-distrito-wok-simon-actualizado.pdf');
  
  // Verificar que existe el HTML
  if (!fs.existsSync(htmlPath)) {
    console.log('[X] No se encontro temp-menu.html');
    console.log('[i] Ejecuta primero: .\\scripts\\generate-menu-pdf.ps1');
    process.exit(1);
  }
  
  console.log('[i] Abriendo navegador...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Cargar el HTML
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generar PDF sin bordes
  console.log('[i] Generando PDF...');
  await page.pdf({
    path: pdfPath,
    width: '210mm',
    height: '600mm',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });
  
  await browser.close();
  
  console.log('[OK] PDF generado exitosamente');
  console.log('[i] Ubicacion: ' + pdfPath);
}

generatePDF().catch(console.error);