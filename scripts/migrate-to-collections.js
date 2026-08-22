const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

async function migrateToCollections() {
  console.log('Migrando menú a colecciones separadas...\n');

  const categories = ['arroces', 'corrientes', 'porciones', 'bebidas'];

  for (const category of categories) {
    console.log(`\nMigrando ${category}...`);

    const menuRef = collection(db, 'menu');
    const snapshot = await getDocs(menuRef);

    let count = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      if (data.category === category) {
        const newDocRef = await addDoc(collection(db, category), {
          name: data.name,
          description: data.description || '',
          price: data.price,
          available: data.available !== false,
          createdAt: data.createdAt || new Date(),
        });

        console.log(`  ✓ ${data.name} → ${category}/${newDocRef.id}`);

        await deleteDoc(doc(db, 'menu', docSnap.id));

        count++;
      }
    }

    console.log(`  Total ${category}: ${count} items`);
  }

  console.log('\n✅ Migración completada');
}

migrateToCollections().catch(console.error);
