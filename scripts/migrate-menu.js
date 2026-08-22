const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const menuData = {
  arroces: [
    { name: 'Arroz Costeño Wok', desc: 'Cerdo, pollo, chorizo y butifarra, coronado con jamón', price: '30K / 40K' },
    { name: 'Arroz Especial Wok', desc: 'Cerdo, pollo, camarón y chorizo', price: '27K / 37K' },
    { name: 'Arroz Valenciana Wok', desc: 'Cerdo, pollo, camarón, chorizo y butifarra', price: '25K / 33K' },
    { name: 'Arroz Currambero Wok', desc: 'Chorizo, butifarra, cerdo y pollo con chicharrón', price: '37K / 50K' },
    { name: 'Arroz Tres Carnes Wok', desc: 'Pollo, cerdo y res', price: '27K / 37K' },
    { name: 'Arroz Oriental Wok', desc: 'Camarón, pollo, cerdo y vegetales', price: '32K / 47K' },
    { name: 'Arroz Criollo Wok', desc: 'Pollo, cerdo, chorizo y huevo', price: '29K / 37K' },
    { name: 'Arroz Vegetal Wok', desc: 'Vegetales frescos salteados al wok', price: '29K / 37K' },
    { name: 'Arroz Pollo Wok', desc: 'Pollo jugoso salteado al wok con vegetales frescos', price: '26K / 35K' },
    { name: 'Arroz Cerdo Wok', desc: 'Cerdo sazonado con especias orientales', price: '26K / 35K' },
    { name: 'Arroz Camarón Wok', desc: 'Camarones frescos con vegetales', price: '31K / 40K' },
    { name: 'Arroz Carne Wok', desc: 'Carne de res jugosa con vegetales', price: '30K / 38K' },
    { name: 'Arroz Pollo y Carne', desc: 'Combinación de pollo y carne', price: '30K / 38K' },
    { name: 'Arroz Pollo y Cerdo', desc: 'Combinación de pollo y cerdo', price: '26K / 36K' },
    { name: 'Arroz Pollo y Camarón', desc: 'Combinación de pollo y camarón', price: '30K / 40K' },
    { name: 'Arroz Parrillada Wok', desc: 'Mezcla de carnes a la parrilla', price: '27K / 37K' },
    { name: 'Arroz Rey Colis Wok', desc: 'Nuestra especialidad premium', price: '37K / 47K' },
  ],
  corrientes: [
    { name: 'Punta de Anca', desc: 'Corte premium a la parrilla', price: '$35.000' },
    { name: 'Lomo al Trapo', desc: 'Lomo envuelto en sal cocido', price: '$38.000' },
    { name: 'Chuleta Valluna', desc: 'Chuleta empanizada antioqueña', price: '$28.000' },
    { name: 'Mojarra Frita', desc: 'Mojarra entera crujiente', price: '$30.000' },
    { name: 'Punta de Anca en Salsa', desc: 'Punta de anca en salsa de la casa', price: '$38.000' },
    { name: 'Pollo a la Plancha', desc: 'Pechuga de pollo saludable', price: '$25.000' },
    { name: 'Costillas BBQ', desc: 'Costillas bañadas en salsa BBQ', price: '$40.000' },
    { name: 'Trucha en Salsa', desc: 'Trucha en salsa de alcaparras', price: '$35.000' },
    { name: 'Sancocho', desc: 'Sancocho tradicional', price: '$12.000' },
  ],
  porciones: [
    { name: 'Patacones', desc: 'Plátano verde frito crujiente', price: '$8.000' },
    { name: 'Arroz Blanco', desc: 'Porción de arroz', price: '$4.000' },
    { name: 'Ensalada', desc: 'Ensalada fresca de la casa', price: '$8.000' },
    { name: 'Yuca Frita', desc: 'Yuca crujiente con suero', price: '$8.000' },
    { name: 'Papas Fritas', desc: 'Papas fritas doradas', price: '$8.000' },
    { name: 'Tostones', desc: 'Plátano maduro frito', price: '$8.000' },
    { name: 'Arepa', desc: 'Arepa con mantequilla', price: '$3.000' },
  ],
  bebidas: [
    { name: 'Coca-Cola 600ML', price: '$4.500' },
    { name: 'Coca-Cola 1.5LT', price: '$8.000' },
    { name: 'Gaseosa Cola 1.5LT', price: '$6.000' },
    { name: 'Gaseosa Manzana 1.5LT', price: '$6.000' },
    { name: 'Gaseosa Limón 1.5LT', price: '$6.000' },
    { name: 'Agua Brisa 600ML', price: '$2.000' },
    { name: 'Agua Manantial 600ML', price: '$3.500' },
    { name: 'Jugo Hit Naranja 400ML', price: '$4.000' },
    { name: 'Jugo Hit Mango 400ML', price: '$4.000' },
    { name: 'Jugo Hit Lulo 400ML', price: '$4.000' },
    { name: 'Jugo Vallevita 400ML', price: '$4.000' },
    { name: 'Sprite 400ML', price: '$4.000' },
    { name: 'Colombiana 400ML', price: '$4.000' },
    { name: 'Pony Malta 400ML', price: '$4.000' },
    { name: 'Agua Cristal 600ML', price: '$3.000' },
  ],
};

async function migrateMenu() {
  console.log('Iniciando migración del menú a Firestore...\n');

  let totalItems = 0;

  for (const [category, items] of Object.entries(menuData)) {
    console.log(`Migrando ${category}...`);

    for (const item of items) {
      try {
        await addDoc(collection(db, category), {
          name: item.name,
          description: item.desc || '',
          price: item.price,
          available: true,
          createdAt: new Date(),
        });
        totalItems++;
        console.log(`  ✓ ${item.name}`);
      } catch (error) {
        console.log(`  ✗ Error con ${item.name}:`, error.message);
      }
    }
  }

  console.log(`\nMigración completada: ${totalItems} items migrados`);
}

migrateMenu().catch(console.error);
