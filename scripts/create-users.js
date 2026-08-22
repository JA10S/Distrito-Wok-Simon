const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  { email: 'admin@distritowok.com', password: 'Admin123456', roles: ['admin'], name: 'Administrador' },
  { email: 'camarero@distritowok.com', password: 'Camarero123456', roles: ['waiter'], name: 'Camarero' },
  { email: 'cajero@distritowok.com', password: 'Cajero123456', roles: ['cashier'], name: 'Cajero' },
  { email: 'domicilio@distritowok.com', password: 'Domicilio123456', roles: ['delivery'], name: 'Domiciliario' },
];

async function createUsers() {
  console.log('Creando usuarios de prueba...\n');

  for (const userData of users) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email,
        roles: userData.roles,
        name: userData.name,
        active: true,
        createdAt: new Date(),
      });

      console.log(`✅ ${userData.roles.join(', ')}: ${userData.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ ${userData.email} ya existe`);
      } else {
        console.log(`❌ Error con ${userData.email}:`, error.message);
      }
    }
  }

  console.log('\n✅ Proceso completado');
}

createUsers().catch(console.error);
