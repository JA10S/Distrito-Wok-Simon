import { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

// Llamados de atención de los clientes (pendientes → atendidos)
export function useCalls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, 'calls'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const callsData = [];
        snapshot.forEach((item) => {
          callsData.push({ id: item.id, ...item.data() });
        });
        setCalls(callsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching calls:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resolveCall = async (callId, user = null) => {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'done',
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid || null,
        resolvedByName: user?.displayName || user?.email || ''
      });
      return { success: true };
    } catch (err) {
      console.error('Error resolving call:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    calls,
    pendingCalls: calls.filter((call) => call.status === 'pending'),
    loading,
    error,
    resolveCall
  };
}
