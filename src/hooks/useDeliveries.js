import { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

export function useDeliveries(status = null) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    const deliveriesRef = collection(db, 'deliveries');
    let q;

    if (status) {
      q = query(deliveriesRef, where('status', '==', status));
    } else {
      q = deliveriesRef;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setDeliveries(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching deliveries:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status]);

  const createDelivery = async (deliveryData) => {
    try {
      const docRef = await addDoc(collection(db, 'deliveries'), {
        ...deliveryData,
        status: 'ready',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error creating delivery:', err);
      return { success: false, error: err.message };
    }
  };

  const takeDelivery = async (deliveryId, userId, userName) => {
    try {
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      await updateDoc(deliveryRef, {
        status: 'delivering',
        assignedTo: userId,
        assignedName: userName,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error taking delivery:', err);
      return { success: false, error: err.message };
    }
  };

  const markDelivered = async (deliveryId) => {
    try {
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      const snap = await getDoc(deliveryRef);
      const data = snap.exists() ? snap.data() : null;

      await updateDoc(deliveryRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Reflejar la entrega en el pedido vinculado (sin tocar su status de flujo)
      if (data && data.orderId) {
        try {
          await updateDoc(doc(db, 'orders', data.orderId), {
            deliveredAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (orderErr) {
          console.error('Error syncing delivery to order:', orderErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error marking delivered:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelDelivery = async (deliveryId) => {
    try {
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      await updateDoc(deliveryRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error cancelling delivery:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    deliveries,
    loading,
    error,
    createDelivery,
    takeDelivery,
    markDelivered,
    cancelDelivery
  };
}
