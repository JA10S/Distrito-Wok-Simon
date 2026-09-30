import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { app } from './firebase';
import { calculateTotals } from '../utils/orderUtils';

const db = getFirestore(app);

export async function createTakeawayOrder({
  type,
  customer,
  preferredPayment = 'cash',
  items,
  notes = '',
  source = 'client',
  staff = null
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'El pedido debe tener al menos un item' };
  }

  const { subtotal, tax, total } = calculateTotals(items);

  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      type,
      tableId: null,
      tableNumber: 0,
      items,
      notes: notes.trim(),
      subtotal,
      tax,
      total,
      customer: {
        name: (customer.name || '').trim(),
        phone: (customer.phone || '').trim(),
        address: type === 'delivery' ? (customer.address || '').trim() : null,
        reference: (customer.reference || '').trim(),
        notes: (customer.notes || '').trim()
      },
      preferredPayment,
      source,
      createdBy: staff ? staff.uid || null : null,
      createdByName: staff ? staff.name || '' : '',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      id: docRef.id,
      orderNumber: docRef.id.slice(-6).toUpperCase()
    };
  } catch (err) {
    console.error('Error creating takeaway order:', err);
    return { success: false, error: err.message };
  }
}

export function watchOrder(orderId, onOrder, onError) {
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snapshot) => {
      if (snapshot.exists()) {
        onOrder({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (err) => {
      console.error('Error watching order:', err);
      if (onError) onError(err);
    }
  );
}
