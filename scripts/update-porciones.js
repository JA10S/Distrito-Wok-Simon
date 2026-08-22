const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const correctPorciones = [
  { name: 'Valenciana', price: '12K' },
  { name: 'Porción de Arroz', price: '5K' },
  { name: 'Papas', price: '7K' },
  { name: 'Pollo', price: '6K' },
  { name: 'Papas con Pollo', price: '12K' },
  { name: 'Sopas', price: '6K' },
  { name: 'Sancocho', price: '12K' },
];

async function updatePorciones() {
  console.log('Actualizando porciones...\n');

  // Eliminar porciones existentes
  const porcionesRef = collection(db, 'porciones');
  const snapshot = await getDocs(porcionesRef);

  console.log('Eliminando porciones anteriores...');
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'porciones', docSnap.id));
    console.log(`  ✓ Eliminado: ${docSnap.data().name}`);
  }

  // Agregar porciones correctas
  console.log('\nAgregando porciones correctas...');
  for (const porcion of correctPorciones) {
    const docRef = await addDoc(collection(db, 'porciones'), {
      name: porcion.name,
      description: '',
      price: porcion.price,
      available: true,
      createdAt: new Date(),
    });
    console.log(`  ✓ ${porcion.name}: ${porcion.price}`);
  }

  console.log('\n✅ Porciones actualizadas');
}

updatePorciones().catch(console.error);
