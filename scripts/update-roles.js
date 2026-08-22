const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const roleTranslations = {
  'admin': 'Administrador',
  'waiter': 'Camarero',
  'cashier': 'Cajero',
  'delivery': 'Domiciliario'
};

async function updateRoles() {
  console.log('Actualizando roles a español...\n');

  const snapshot = await getDocs(collection(db, 'users'));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const newRole = roleTranslations[data.role];

    if (newRole) {
      await updateDoc(doc(db, 'users', docSnap.id), { role: newRole });
      console.log(`✅ ${data.email}: ${data.role} → ${newRole}`);
    }
  }

  console.log('\n✅ Roles actualizados');
}

updateRoles().catch(console.error);
