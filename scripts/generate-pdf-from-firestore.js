const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const COLLECTIONS = ['arroces', 'corrientes', 'porciones', 'bebidas'];

async function fetchMenuData() {
  const menuData = {
    arroces: [],
    corrientes: [],
    porciones: [],
    bebidas: [],
  };

  for (const collectionName of COLLECTIONS) {
    const snapshot = await getDocs(collection(db, collectionName));
    snapshot.forEach((doc) => {
      menuData[collectionName].push(doc.data());
    });
  }

  return menuData;
}

function generateHTML(menuData) {
  const arrocesHTML = menuData.arroces.map(item => `
    <li>
      <div class="plato-fila">
        <div class="plato-info">
          <div class="plato-nombre">${item.name}</div>
          ${item.description ? `<div class="plato-descripcion">${item.description}</div>` : ''}
        </div>
        <div class="plato-precio">${item.price.replace(' / ', ' <span class="sep">/</span> ')}</div>
      </div>
    </li>
  `).join('');

  const corrientesHTML = menuData.corrientes.map(item => `
    <div class="item-row">
      <span class="item-nombre">${item.name}</span>
      <span class="item-precio">${item.price}</span>
    </div>
  `).join('');

  const porcionesHTML = menuData.porciones.map(item => `
    <div class="item-row">
      <span class="item-nombre">${item.name}</span>
      <span class="item-precio">${item.price}</span>
    </div>
  `).join('');

  const bebidasHTML = menuData.bebidas.map(item => `
    <div class="item-row">
      <span class="item-nombre">${item.name}</span>
      <span class="item-precio">${item.price}</span>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Menú - Distrito Wok Simón</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  @page{
    size:210mm 600mm;
    margin:0;
  }

  @media print{
    html,body{
      margin:0;
      padding:0;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
  }

  *{ margin:0; padding:0; box-sizing:border-box; }

  :root{
    --dorado:#D4A843;
    --dorado-claro:#F6DE9A;
    --dorado-oscuro:#8B6914;
    --rojo:#C40F0F;
    --rojo-oscuro:#8B0000;
    --negro:#0d0d0d;
  }

  body{
    font-family:'Montserrat',sans-serif;
    background:var(--negro);
    color:var(--dorado-claro);
    margin:0;
    padding:0;
  }

  .pagina{
    width:210mm;
    height:600mm;
    padding:20px 30px;
    page-break-after:always;
    overflow:hidden;
  }

  .pagina:last-child{
    page-break-after:auto;
  }

  .encabezado{
    text-align:center;
    padding:14px 0 12px;
    border-bottom:1px solid var(--dorado-oscuro);
    margin-bottom:12px;
  }

  .simbolos-chinos{
    font-size:12px;
    letter-spacing:8px;
    color:var(--dorado-oscuro);
    margin-bottom:6px;
    opacity:0.7;
  }

  .logo-principal{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:16px;
    margin-bottom:6px;
  }

  .logo-principal .linea{
    width:40px;
    height:1px;
    background:linear-gradient(90deg, transparent, var(--dorado));
  }

  .logo-principal h1{
    font-family:'Cormorant Garamond',serif;
    font-size:60px;
    font-weight:700;
    letter-spacing:4px;
    color:var(--dorado-claro);
  }

  .logo-principal h1 span{
    color:var(--rojo);
    font-style:italic;
  }

  .eslogan{
    font-size:14px;
    letter-spacing:7px;
    text-transform:uppercase;
    color:var(--dorado);
    margin-top:8px;
  }

  .seccion-titulo{
    text-align:center;
    position:relative;
    margin-bottom:14px;
    padding:10px 0;
  }

  .seccion-titulo h2{
    font-family:'Cormorant Garamond',serif;
    font-size:40px;
    font-weight:600;
    letter-spacing:4px;
    text-transform:uppercase;
    color:var(--dorado);
  }

  .seccion-titulo::after{
    content:"";
    display:block;
    width:40px;
    height:1px;
    background:var(--dorado-oscuro);
    margin:5px auto 0;
  }

  .subtitulo-precio{
    text-align:right;
    font-size:14px;
    color:var(--dorado-oscuro);
    font-style:italic;
    margin-bottom:10px;
  }

  .menu-lista{
    list-style:none;
  }

  .menu-lista li{
    padding:7px 0;
    border-bottom:1px solid rgba(139,105,20,0.25);
  }

  .menu-lista li:last-child{
    border-bottom:none;
  }

  .plato-fila{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:8px;
  }

  .plato-info{
    flex:1;
  }

  .plato-nombre{
    font-family:'Cormorant Garamond',serif;
    font-size:28px;
    font-weight:700;
    color:var(--dorado-claro);
    margin-bottom:3px;
  }

  .plato-descripcion{
    font-size:16px;
    color:#ffffff;
    font-style:italic;
    line-height:1.4;
  }

  .plato-precio{
    font-family:'Montserrat',sans-serif;
    font-size:26px;
    font-weight:600;
    color:var(--dorado);
    white-space:nowrap;
  }

  .plato-precio .sep{
    color:var(--dorado-oscuro);
    margin:0 3px;
  }

  .divisor{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    margin:12px 0;
  }

  .divisor .linea{
    flex:1;
    height:1px;
    background:linear-gradient(90deg, transparent, var(--dorado-oscuro), transparent);
  }

  .divisor .diamante{
    width:6px; height:6px;
    background:var(--dorado);
    transform:rotate(45deg);
  }

  .items-grid{
    display:flex;
    flex-direction:column;
    gap:2px;
  }

  .item-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:6px 0;
    border-bottom:1px dotted rgba(139,105,20,0.3);
  }

  .item-row:last-child{
    border-bottom:none;
  }

  .item-nombre{
    font-family:'Cormorant Garamond',serif;
    font-size:28px;
    font-weight:700;
    color:var(--dorado-claro);
  }

  .item-precio{
    font-family:'Montserrat',sans-serif;
    font-size:26px;
    font-weight:600;
    color:var(--dorado);
  }

  .pie-menu{
    text-align:center;
    margin-top:12px;
    padding-top:10px;
    border-top:1px solid var(--dorado-oscuro);
  }

  .gracias{
    background:linear-gradient(135deg, var(--rojo) 0%, var(--rojo-oscuro) 100%);
    color:var(--dorado-claro);
    display:inline-block;
    padding:14px 32px;
    font-family:'Cormorant Garamond',serif;
    font-size:26px;
    letter-spacing:4px;
    text-transform:uppercase;
    border:1px solid var(--dorado-oscuro);
  }

  .ornamento-final{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    margin-top:6px;
  }

  .ornamento-final .linea{
    width:20px;
    height:1px;
    background:var(--dorado-oscuro);
  }

  .ornamento-final .punto{
    width:4px; height:4px;
    background:var(--dorado);
    border-radius:50%;
  }
</style>
</head>
<body>

<!-- PAGINA 1: Arroces y Corrientes -->
<div class="pagina">

  <div class="encabezado">
    <div class="simbolos-chinos">道 場 名 店 ・ 風 味 東 方</div>
    <div class="logo-principal">
      <div class="linea"></div>
      <h1>Distrito <span>Wok</span> Simón</h1>
      <div class="linea"></div>
    </div>
    <div class="eslogan">El verdadero sabor oriental</div>
  </div>

  <div class="seccion-titulo">
    <h2>Nuestros Arroces</h2>
  </div>
  <div class="subtitulo-precio">precio · medio / entero</div>

  <ul class="menu-lista">
    ${arrocesHTML}
  </ul>

  <div class="divisor">
    <div class="linea"></div>
    <div class="diamante"></div>
    <div class="linea"></div>
  </div>

  <div class="seccion-titulo">
    <h2>Corrientes</h2>
  </div>
  <div class="items-grid">
    ${corrientesHTML}
  </div>

</div>

<!-- PAGINA 2: Porciones y Bebidas -->
<div class="pagina">

  <div class="encabezado">
    <div class="simbolos-chinos">道 場 名 店 ・ 風 味 東 方</div>
    <div class="logo-principal">
      <div class="linea"></div>
      <h1>Distrito <span>Wok</span> Simón</h1>
      <div class="linea"></div>
    </div>
    <div class="eslogan">El verdadero sabor oriental</div>
  </div>

  <div class="seccion-titulo">
    <h2>Porciones</h2>
  </div>
  <div class="items-grid">
    ${porcionesHTML}
  </div>

  <div class="divisor">
    <div class="linea"></div>
    <div class="diamante"></div>
    <div class="linea"></div>
  </div>

  <div class="seccion-titulo">
    <h2>Bebidas</h2>
  </div>
  <div class="items-grid">
    ${bebidasHTML}
  </div>

  <div class="pie-menu">
    <div class="gracias">¡Gracias por su visita!</div>
    <div class="ornamento-final">
      <div class="linea"></div>
      <div class="punto"></div>
      <div class="linea"></div>
      <div class="punto"></div>
      <div class="linea"></div>
    </div>
  </div>

</div>

</body>
</html>`;
}

async function generatePDF() {
  console.log('Generando menú desde Firestore...\n');

  const menuData = await fetchMenuData();
  console.log('Datos obtenidos:');
  console.log(`  - Arroces: ${menuData.arroces.length}`);
  console.log(`  - Corrientes: ${menuData.corrientes.length}`);
  console.log(`  - Porciones: ${menuData.porciones.length}`);
  console.log(`  - Bebidas: ${menuData.bebidas.length}`);

  const html = generateHTML(menuData);
  const tempHtmlPath = path.join(__dirname, '..', 'temp-menu-generated.html');
  const pdfPath = path.join(__dirname, '..', 'archive', 'pdfs', 'menu-distrito-wok-simon-actualizado.pdf');

  fs.writeFileSync(tempHtmlPath, html, 'utf8');
  console.log('\nHTML generado temporalmente');

  console.log('Generando PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: pdfPath,
    width: '210mm',
    height: '600mm',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  await browser.close();

  console.log('✅ PDF generado exitosamente');
  console.log(`📍 Ubicación: ${pdfPath}`);
}

generatePDF().catch(console.error);
