const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const initialTables = [
  { number: 1, capacity: 4, status: 'available' },
  { number: 2, capacity: 4, status: 'available' },
  { number: 3, capacity: 2, status: 'available' },
  { number: 4, capacity: 6, status: 'available' },
  { number: 5, capacity: 4, status: 'available' },
  { number: 6, capacity: 4, status: 'available' },
  { number: 7, capacity: 2, status: 'available' },
  { number: 8, capacity: 8, status: 'available' },
];

async function initTables() {
  console.log('Inicializando mesas...\n');

  for (const table of initialTables) {
    try {
      const docRef = await addDoc(collection(db, 'tables'), {
        ...table,
        createdAt: new Date(),
      });
      console.log(`✅ Mesa ${table.number} (${table.capacity} personas) → ${docRef.id}`);
    } catch (error) {
      console.log(`❌ Error con Mesa ${table.number}:`, error.message);
    }
  }

  console.log('\n✅ Mesas inicializadas');
}

initTables().catch(console.error);
