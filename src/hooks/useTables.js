import { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

export function useTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'tables'),
      (snapshot) => {
        const tablesData = [];
        snapshot.forEach((doc) => {
          tablesData.push({ id: doc.id, ...doc.data() });
        });
        
        tablesData.sort((a, b) => a.number - b.number);
        setTables(tablesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tables:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateTableStatus = async (tableId, status) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updateData = {
        status: status,
        updatedAt: serverTimestamp()
      };

      if (status === 'occupied') {
        updateData.occupiedAt = serverTimestamp();
      } else if (status === 'available') {
        updateData.occupiedAt = null;
      }

      await updateDoc(tableRef, updateData);
      return { success: true };
    } catch (err) {
      console.error('Error updating table:', err);
      return { success: false, error: err.message };
    }
  };

  return { tables, loading, error, updateTableStatus };
}
