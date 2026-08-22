import { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

const COLLECTIONS = ['arroces', 'corrientes', 'porciones', 'bebidas'];

export function useMenu() {
  const [menu, setMenu] = useState({
    arroces: [],
    corrientes: [],
    porciones: [],
    bebidas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribes = [];

    COLLECTIONS.forEach((collectionName) => {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, orderBy('name'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setMenu((prev) => ({ ...prev, [collectionName]: items }));
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  return { menu, loading, error };
}
