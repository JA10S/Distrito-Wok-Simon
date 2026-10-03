import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

// Llamado de atención creado por un cliente desde el menú web (sin sesión)
export async function createCall({ tableNumber, message = '' }) {
  const number = parseInt(tableNumber, 10);
  if (!number || number < 1) {
    return { success: false, error: 'Ingrese el número de mesa' };
  }

  try {
    const docRef = await addDoc(collection(db, 'calls'), {
      tableNumber: number,
      message: String(message || '').trim(),
      status: 'pending',
      source: 'client',
      createdAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error creating call:', err);
    return { success: false, error: err.message };
  }
}
