import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';
import { timestampMs } from '../utils/orderUtils';

const db = getFirestore(app);

/** Clave local del día: YYYY-MM-DD (un cierre por día, doc ID = fecha). */
export const dayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Cierre de caja del día actual (tiempo real) + función para cerrar.
 * Doc: cash_closings/{YYYY-MM-DD} con { date, summary, countedCash, difference, notes, closedBy, closedAt }
 */
export function useCashClosing() {
  const dateKey = dayKey();
  const [closing, setClosing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'cash_closings', dateKey),
      (snap) => {
        setClosing(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching cash closing:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [dateKey]);

  const closeRegister = useCallback(async ({ summary = {}, countedCash, notes, user, date }) => {
    try {
      const value = Number(countedCash);
      if (!Number.isFinite(value) || value < 0) {
        return { success: false, error: 'Ingrese el efectivo contado válido' };
      }
      const key = date || dayKey();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        return { success: false, error: 'Fecha inválida' };
      }
      if (key > dayKey()) {
        return { success: false, error: 'No se puede cerrar la caja de un día futuro' };
      }
      const difference = value - Number(summary.cashExpected || 0);
      await setDoc(
        doc(db, 'cash_closings', key),
        {
          date: key,
          summary: {
            totalSales: Number(summary.totalSales || 0),
            cash: Number(summary.cash || 0),
            transfer: Number(summary.transfer || 0),
            bold: Number(summary.bold || 0),
            card: Number(summary.card || 0),
            expenses: Number(summary.expenses || 0),
            cashExpenses: Number(summary.cashExpenses || 0),
            cashExpected: Number(summary.cashExpected || 0),
            ordersCount: Number(summary.ordersCount || 0),
            avgTicket: Number(summary.avgTicket || 0)
          },
          countedCash: value,
          difference,
          notes: String(notes || '').trim(),
          closedBy: user?.email || '',
          closedByUid: user?.uid || null,
          closedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      return { success: true, date: key, difference };
    } catch (err) {
      console.error('Error closing register:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return { closing, loading, error, closeRegister };
}

/** Historial de cierres de caja (para el administrador), más reciente primero. */
export function useCashClosings(max = 30) {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'cash_closings'), orderBy('date', 'desc'), limit(max)),
      (snapshot) => {
        const data = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setClosings(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching cash closings:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [max]);

  return { closings, loading, error };
}

/** Hora local legible de un timestamp de cierre. */
export const closingTime = (value) => {
  const ms = timestampMs(value);
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};
