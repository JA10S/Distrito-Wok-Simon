const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const roles = {
  admin: {
    name: 'Administrador',
    permissions: [
      'view_dashboard',
      'manage_menu',
      'manage_users',
      'manage_permissions',
      'view_reports',
      'create_order',
      'update_order_status',
      'close_table',
      'charge_orders',
      'view_history',
      'cash_register',
      'view_deliveries',
      'update_delivery_status',
      'mark_as_delivered'
    ]
  },
  waiter: {
    name: 'Camarero',
    permissions: [
      'create_order',
      'view_menu',
      'update_order_status',
      'close_table'
    ]
  },
  cashier: {
    name: 'Cajero',
    permissions: [
      'charge_orders',
      'view_history',
      'cash_register'
    ]
  },
  delivery: {
    name: 'Domiciliario',
    permissions: [
      'view_deliveries',
      'update_delivery_status',
      'mark_as_delivered'
    ]
  }
};

const users = [
  {
    uid: 'admin-uid-001',
    email: 'admin@distritowok.com',
    name: 'Administrador',
    roles: ['admin']
  }
];

async function initializeRoles() {
  console.log('Inicializando roles en Firestore...\n');

  try {
    for (const [roleId, roleData] of Object.entries(roles)) {
      await setDoc(doc(db, 'roles', roleId), {
        ...roleData,
        createdAt: new Date()
      });
      console.log(`✅ Rol creado: ${roleData.name}`);
    }

    console.log('\nInicializando usuarios...\n');

    for (const user of users) {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: new Date()
      });
      console.log(`✅ Usuario creado: ${user.email}`);
    }

    console.log('\n✅ Roles y usuarios inicializados correctamente');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

initializeRoles().catch(console.error);
