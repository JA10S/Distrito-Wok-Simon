const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const MENU_COLLECTIONS = ['arroces', 'corrientes', 'porciones', 'bebidas'];
const SPANISH_FIELDS = {
  nombre: 'name',
  precio: 'price',
  descripcion: 'description',
  disponible: 'available',
};

let issues = 0;

function report(message, isError) {
  if (isError) {
    console.log(`    [x] ${message}`);
    issues++;
  } else {
    console.log(`    [i] ${message}`);
  }
}

async function checkMenuCollection(name) {
  try {
    const snapshot = await getDocs(collection(db, name));
    if (snapshot.empty) {
      console.log(`  [!] Coleccion '${name}' vacia`);
      issues++;
      return;
    }
    console.log(`  ${name}: ${snapshot.size} items`);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      if (!data.name) report(`${id}: falta campo 'name'`, true);
      if (!data.price) report(`${id}: falta campo 'price'`, true);
      if (data.available !== undefined && typeof data.available !== 'boolean') {
        report(`${id}: 'available' no es booleano`, true);
      }

      Object.entries(SPANISH_FIELDS).forEach(([spanish, english]) => {
        if (data[spanish] !== undefined) {
          report(`${id}: usa campo en espanol '${spanish}' -> deberia ser '${english}'`, true);
        }
      });
    });
  } catch (error) {
    console.log(`  [!] No se pudo leer '${name}': ${error.message}`);
    issues++;
  }
}

async function checkRoles() {
  try {
    const snapshot = await getDocs(collection(db, 'roles'));
    if (snapshot.empty) {
      console.log('  [!] Coleccion roles vacia');
      issues++;
      return;
    }
    console.log(`  roles: ${snapshot.size} roles`);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.name) report(`${docSnap.id}: falta campo 'name'`, true);
      if (!Array.isArray(data.permissions)) report(`${docSnap.id}: 'permissions' no es array`, true);
    });
  } catch (error) {
    console.log(`  [!] No se pudo leer 'roles': ${error.message}`);
    issues++;
  }
}

async function checkUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    console.log(`  users: ${snapshot.size} usuarios`);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!Array.isArray(data.roles)) {
        report(`${docSnap.id}: 'roles' no es array (campo 'role' string en desuso)`, true);
      }
    });
  } catch (error) {
    console.log(`  [!] No se pudo leer 'users': ${error.message}`);
    issues++;
  }
}

async function validate() {
  console.log('Validando estructura de datos en Firestore...\n');

  for (const name of MENU_COLLECTIONS) {
    await checkMenuCollection(name);
  }
  await checkRoles();
  await checkUsers();

  console.log('');
  if (issues > 0) {
    console.log(`Validacion de Firestore fallida: ${issues} problema(s) encontrado(s)`);
    process.exit(1);
  }
  console.log('Validacion de Firestore exitosa');
  process.exit(0);
}

validate().catch((error) => {
  console.error(error);
  process.exit(1);
});
