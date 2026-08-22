const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const defaultPermissions = {
  waiter: {
    canCreateOrders: true,
    canViewMenu: true,
    canUpdateOrderStatus: true,
    canCloseTable: true,
  },
  cashier: {
    canChargeOrders: true,
    canViewHistory: true,
    canDoCashRegister: true,
  },
  delivery: {
    canViewDeliveries: true,
    canUpdateDeliveryStatus: true,
    canMarkAsDelivered: true,
  },
};

async function initPermissions() {
  console.log('Inicializando permisos...\n');

  try {
    await setDoc(doc(db, 'settings', 'permissions'), {
      ...defaultPermissions,
      updatedAt: new Date(),
    });
    console.log('✅ Permisos inicializados en Firestore');
    console.log('Ubicación: settings/permissions');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

initPermissions().catch(console.error);
