import { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  where,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

export function useOrders(status = null) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (status) {
      q = query(ordersRef, where('status', '==', status));
    } else {
      q = ordersRef;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = [];
        snapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status]);

  const createOrder = async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error creating order:', err);
      return { success: false, error: err.message };
    }
  };

  const processPayment = async (orderId, paymentMethod) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'paid',
        paymentMethod: paymentMethod,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error processing payment:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'preparing') {
        updateData.preparingAt = serverTimestamp();
      } else if (newStatus === 'ready') {
        updateData.readyAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (err) {
      console.error('Error updating order:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      await updateDoc(tableRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating table:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.items) {
        const subtotal = updates.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.10);
        updateData.subtotal = subtotal;
        updateData.tax = tax;
        updateData.total = subtotal + tax;
      }

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (err) {
      console.error('Error updating order:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error cancelling order:', err);
      return { success: false, error: err.message };
    }
  };

  return { 
    orders, 
    loading, 
    error, 
    createOrder, 
    processPayment, 
    updateOrderStatus,
    updateTableStatus,
    updateOrder,
    cancelOrder
  };
}
