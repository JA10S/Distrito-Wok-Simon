const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);
const auth = getAuth(app);

// Permisos nuevos (merge seguro: solo agrega, nunca borra)
const ADDITIONS = {
  admin: ['attend_calls', 'transfer_order', 'close_shift', 'track_drivers', 'manage_credit'],
  cashier: ['manage_credit'],
  waiter: ['attend_calls', 'transfer_order', 'close_shift']
};

async function addPermissions() {
  await signInWithEmailAndPassword(auth, 'admin@distritowok.com', 'Admin123456');
  console.log('Autenticado como admin\n');
  console.log('Agregando permisos nuevos a roles existentes (merge)...\n');

  try {
    for (const [roleId, permissions] of Object.entries(ADDITIONS)) {
      const ref = doc(db, 'roles', roleId);
      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        console.log(`⚠️  Rol ${roleId} no existe en Firestore (omitido)`);
        continue;
      }

      const current = snapshot.data().permissions || [];
      const missing = permissions.filter((p) => !current.includes(p));

      if (missing.length === 0) {
        console.log(`✅ Rol ${roleId}: ya tenía ${permissions.join(', ')}`);
        continue;
      }

      await updateDoc(ref, { permissions: arrayUnion(...missing) });
      console.log(`✅ Rol ${roleId}: agregados -> ${missing.join(', ')}`);
    }

    console.log('\n✅ Permisos actualizados');
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exitCode = 1;
  }
}

addPermissions().catch((err) => {
  console.log('❌ Error:', err.message);
  process.exitCode = 1;
});
