import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';
import { timestampMs } from '../utils/orderUtils';

const db = getFirestore(app);

/** Registros de compras pagadas con la caja menor. */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const data = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
        data.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
        setExpenses(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addExpense = useCallback(async ({ concept, amount, method, notes, paymentSplit = null, user }) => {
    try {
      const value = Number(amount);
      if (!concept || !String(concept).trim()) {
        return { success: false, error: 'Ingrese el concepto de la compra' };
      }
      if (!Number.isFinite(value) || value <= 0) {
        return { success: false, error: 'El monto debe ser mayor a 0' };
      }
      const ref = await addDoc(collection(db, 'expenses'), {
        concept: String(concept).trim(),
        amount: value,
        method: method || 'cash',
        paymentSplit: method === 'mixed' ? paymentSplit : null,
        notes: String(notes || '').trim(),
        createdBy: user?.email || '',
        createdByUid: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: ref.id };
    } catch (err) {
      console.error('Error adding expense:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting expense:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateExpense = useCallback(async (expenseId, data) => {
    try {
      const value = data.amount !== undefined ? Number(data.amount) : null;
      if (data.amount !== undefined && (!Number.isFinite(value) || value <= 0)) {
        return { success: false, error: 'El monto debe ser mayor a 0' };
      }
      if (data.concept !== undefined && !String(data.concept).trim()) {
        return { success: false, error: 'Ingrese el concepto de la compra' };
      }
      await updateDoc(doc(db, 'expenses', expenseId), {
        ...data,
        ...(data.concept !== undefined ? { concept: String(data.concept).trim() } : {}),
        ...(data.amount !== undefined ? { amount: value } : {}),
        ...(data.notes !== undefined ? { notes: String(data.notes || '').trim() } : {}),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating expense:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return { expenses, loading, error, addExpense, deleteExpense, updateExpense };
}
