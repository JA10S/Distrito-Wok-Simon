import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';
import { timestampMs } from '../utils/orderUtils';

const db = getFirestore(app);

export const CREDIT_TX_LABELS = {
  fiado: 'Fiado',
  abono: 'Abono',
  cobro: 'Cobro total'
};

/**
 * Cartera de clientes: saldo fiado por cliente + movimientos.
 * `customers.balance` (positivo = debe) se mantiene en el cliente.
 * Cada movimiento queda en `credit_transactions` con su tipo fiado/abono/cobro.
 */
export function useCredit() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const data = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
        data.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
        setCustomers(data);
        setLoading(false);
      },
      (err) => console.error('Error fetching customers:', err)
    );

    const unsubTx = onSnapshot(
      query(collection(db, 'credit_transactions'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setTransactions(data);
      },
      (err) => console.error('Error fetching credit transactions:', err)
    );

    return () => { unsubCustomers(); unsubTx(); };
  }, []);

  const addCustomer = useCallback(async ({ name, phone, notes }) => {
    try {
      if (!name || !String(name).trim()) {
        return { success: false, error: 'Ingrese el nombre del cliente' };
      }
      const ref = await addDoc(collection(db, 'customers'), {
        name: String(name).trim(),
        phone: String(phone || '').trim(),
        notes: String(notes || '').trim(),
        balance: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: ref.id };
    } catch (err) {
      console.error('Error adding customer:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateCustomer = useCallback(async (customerId, data) => {
    try {
      if (data.name !== undefined && !String(data.name).trim()) {
        return { success: false, error: 'Ingrese el nombre del cliente' };
      }
      await updateDoc(doc(db, 'customers', customerId), {
        ...data,
        ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
        ...(data.phone !== undefined ? { phone: String(data.phone || '').trim() } : {}),
        ...(data.notes !== undefined ? { notes: String(data.notes || '').trim() } : {}),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating customer:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteCustomer = useCallback(async (customerId, balance) => {
    try {
      if (Number(balance || 0) !== 0) {
        return { success: false, error: 'No se puede eliminar un cliente con saldo pendiente' };
      }
      await deleteDoc(doc(db, 'customers', customerId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting customer:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Registra un movimiento de la cartera y ajusta el saldo del cliente.
   * type: 'fiado' (sube saldo) | 'abono' (baja saldo parcial) | 'cobro' (saldo a cero).
   */
  const registerCredit = useCallback(async ({ customerId, type, amount, orderId = null, notes = '', user }) => {
    try {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return { success: false, error: 'Cliente no encontrado' };

      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return { success: false, error: 'El monto debe ser mayor a 0' };
      }
      const currentBalance = Number(customer.balance || 0);

      if (type === 'abono' && value > currentBalance) {
        return { success: false, error: `El abono ($${value.toLocaleString()}) supera el saldo ($${currentBalance.toLocaleString()})` };
      }

      let newBalance;
      if (type === 'fiado') newBalance = currentBalance + value;
      else if (type === 'abono') newBalance = currentBalance - value;
      else newBalance = 0; // cobro total

      await addDoc(collection(db, 'credit_transactions'), {
        customerId,
        customerName: customer.name,
        type,
        amount: type === 'cobro' ? currentBalance : value,
        orderId,
        notes: String(notes || '').trim(),
        createdBy: user?.email || '',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'customers', customerId), {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });

      return { success: true, newBalance };
    } catch (err) {
      console.error('Error registering credit:', err);
      return { success: false, error: err.message };
    }
  }, [customers]);

  const totalCredit = customers.reduce((sum, c) => sum + Number(c.balance || 0), 0);

  return {
    customers,
    transactions,
    loading,
    totalCredit,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    registerCredit
  };
}
