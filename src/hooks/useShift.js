import { useState, useEffect } from 'react';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Turno del camarero: un documento por día y camarero (shifts/{uid}_{fecha})
export function useShift(waiterId) {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!waiterId) {
      setShift(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'shifts', `${waiterId}_${dateKey()}`),
      (snapshot) => {
        setShift(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching shift:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [waiterId]);

  const closeShift = async (summary) => {
    if (!waiterId) {
      return { success: false, error: 'Sin usuario autenticado' };
    }

    try {
      const shiftId = `${waiterId}_${dateKey()}`;
      await setDoc(
        doc(db, 'shifts', shiftId),
        {
          waiterId,
          date: dateKey(),
          closedAt: serverTimestamp(),
          summary
        },
        { merge: true }
      );
      return { success: true };
    } catch (err) {
      console.error('Error closing shift:', err);
      return { success: false, error: err.message };
    }
  };

  return { shift, loading, error, closeShift };
}
