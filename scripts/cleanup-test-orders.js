/**
 * Limpieza de datos: orders (incluye facturas del admin) + deliveries +
 * expenses (caja menor) + reinicio de tables.
 *
 * Uso:
 *   node scripts/cleanup-test-orders.js           # respaldo + borra + reinicia
 *   node scripts/cleanup-test-orders.js --dry-run # solo inventario y respaldo, NO borra
 *
 * Requiere permisos de escritura en esas colecciones:
 * abrir temporalmente las reglas (ver AGENTS.md lección 7) y restaurar después.
 *
 * Antes de borrar se guarda un respaldo JSON en backups/.
 */
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const config = require('../src/config/firebase.js');

const app = initializeApp(config.default || config);
const db = getFirestore(app);

const DRY_RUN = process.argv.includes('--dry-run');

async function snapshotCollection(name) {
  const snap = await getDocs(collection(db, name));
  const docs = [];
  snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
  return docs;
}

async function main() {
  console.log(
    DRY_RUN
      ? '🔍 MODO PREVIEW (no borra nada)\n'
      : '🧹 Limpieza de pedidos, facturas y caja menor\n'
  );

  /* 1. Inventario */
  const orders = await snapshotCollection('orders');
  const deliveries = await snapshotCollection('deliveries');
  const tables = await snapshotCollection('tables');
  const expenses = await snapshotCollection('expenses');

  const invoices = orders.filter((o) => o.source === 'admin');

  console.log('Inventario:');
  console.log(`  orders:     ${orders.length} (facturas admin: ${invoices.length})`);
  console.log(`  deliveries: ${deliveries.length}`);
  console.log(`  expenses:   ${expenses.length}`);
  console.log(`  tables:     ${tables.length} (${tables.filter((t) => t.status === 'occupied').length} ocupadas)`);

  if (
    orders.length === 0 &&
    deliveries.length === 0 &&
    expenses.length === 0 &&
    tables.every((t) => t.status !== 'occupied')
  ) {
    console.log('\n✅ Nada que limpiar: ya está en cero.');
    return;
  }

  /* 2. Respaldo */
  const backupsDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupsDir, `cleanup-orders-${stamp}.json`);
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      { createdAt: new Date().toISOString(), orders, deliveries, tables, expenses },
      null,
      2
    )
  );
  console.log(`\n💾 Respaldo: ${path.relative(process.cwd(), backupFile)}`);

  if (DRY_RUN) {
    console.log('\n🔍 Preview terminado (no se borró nada).');
    return;
  }

  /* 3. Borrar pedidos y entregas */
  for (const o of orders) {
    await deleteDoc(doc(db, 'orders', o.id));
  }
  console.log(`🗑  orders eliminados: ${orders.length}`);

  for (const d of deliveries) {
    await deleteDoc(doc(db, 'deliveries', d.id));
  }
  console.log(`🗑  deliveries eliminados: ${deliveries.length}`);

  for (const e of expenses) {
    await deleteDoc(doc(db, 'expenses', e.id));
  }
  console.log(`🗑  expenses eliminados: ${expenses.length}`);

  /* 4. Reiniciar mesas (conserva number/capacity/createdAt) */
  let reset = 0;
  for (const t of tables) {
    if (t.status === 'available' && (t.currentOrderId ?? null) === null) continue;
    await updateDoc(doc(db, 'tables', t.id), {
      status: 'available',
      currentOrderId: null
    });
    reset++;
  }
  console.log(`🔄 mesas reiniciadas: ${reset}`);

  /* 5. Verificación */
  const ordersAfter = await getDocs(collection(db, 'orders'));
  const deliveriesAfter = await getDocs(collection(db, 'deliveries'));
  const expensesAfter = await getDocs(collection(db, 'expenses'));
  console.log('\n✅ Verificación:');
  console.log(`  orders restantes:     ${ordersAfter.size}`);
  console.log(`  deliveries restantes: ${deliveriesAfter.size}`);
  console.log(`  expenses restantes:   ${expensesAfter.size}`);
  console.log(`  mesas libres:         ${tables.length}/${tables.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
