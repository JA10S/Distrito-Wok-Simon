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

export const ACTIVE_ORDER_STATUSES = ['pending', 'preparing', 'ready'];

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
};

export function useOrders(status = null) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusKey = Array.isArray(status) ? status.join(',') : status;

  useEffect(() => {
    setLoading(true);
    
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (statusKey && statusKey.includes(',')) {
      q = query(ordersRef, where('status', 'in', statusKey.split(',')));
    } else if (statusKey) {
      q = query(ordersRef, where('status', '==', statusKey));
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
        ordersData.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
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
  }, [statusKey]);

  const createOrder = async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error creating order:', err);
      return { success: false, error: err.message };
    }
  };

  const processPayment = async (orderId, paymentMethod, cashier = null) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.exists() ? orderSnap.data() : null;

      const updateData = {
        status: 'paid',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (cashier) {
        updateData.cashierId = cashier.uid || null;
        updateData.cashierName = cashier.displayName || cashier.email || '';
      }

      await updateDoc(orderRef, updateData);

      // Sincronizar el pago con la entrega vinculada (domicilio)
      if (orderData && orderData.deliveryId) {
        try {
          await updateDoc(doc(db, 'deliveries', orderData.deliveryId), {
            paymentStatus: 'paid',
            updatedAt: serverTimestamp()
          });
        } catch (deliveryErr) {
          console.error('Error syncing payment to delivery:', deliveryErr);
        }
      }

      if (orderData && orderData.tableId) {
        const tableRef = doc(db, 'tables', orderData.tableId);
        const tableSnap = await getDoc(tableRef);
        const tableData = tableSnap.exists() ? tableSnap.data() : null;

        if (tableData && (!tableData.currentOrderId || tableData.currentOrderId === orderId)) {
          await updateDoc(tableRef, {
            status: 'available',
            occupiedAt: null,
            currentOrderId: null,
            updatedAt: serverTimestamp()
          });
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error processing payment:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      const data = snap.exists() ? snap.data() : null;

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'preparing') {
        updateData.preparingAt = serverTimestamp();
      } else if (newStatus === 'ready') {
        updateData.readyAt = serverTimestamp();

        if (data && data.type === 'delivery' && !data.deliveryId) {
          const deliveryRef = await addDoc(collection(db, 'deliveries'), {
            orderId,
            customer: data.customer?.name || '',
            phone: data.customer?.phone || '',
            address: data.customer?.address || '',
            reference: data.customer?.reference || '',
            notes: data.customer?.notes || data.notes || '',
            items: data.items || [],
            total: data.total || 0,
            preferredPayment: data.preferredPayment || 'cash',
            paymentStatus: data.paymentStatus || 'pending',
            status: 'ready',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          updateData.deliveryId = deliveryRef.id;
        }
      }

      await updateDoc(orderRef, updateData);
      return { success: true };
    } catch (err) {
      console.error('Error updating order:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      const data = snap.exists() ? snap.data() : null;

      if (data && data.status !== 'pending') {
        return {
          success: false,
          error: 'Solo se pueden editar pedidos pendientes (aún no han entrado en cocina)'
        };
      }

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

  const cancelOrder = async (orderId, meta = {}) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      const data = snap.exists() ? snap.data() : null;

      if (!data) return { success: false, error: 'Pedido no encontrado' };
      if (data.status === 'cancelled') return { success: false, error: 'El pedido ya está cancelado' };
      if (data.status === 'paid') return { success: false, error: 'El pedido ya fue pagado' };

      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledFromStatus: data.status || null,
        cancelledAt: serverTimestamp(),
        cancelledBy: meta.userId || null,
        cancelledByName: meta.name || '',
        cancelledReason: meta.reason || null,
        updatedAt: serverTimestamp()
      });

      if (data.deliveryId) {
        try {
          await updateDoc(doc(db, 'deliveries', data.deliveryId), {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (deliveryErr) {
          console.error('Error cancelling linked delivery:', deliveryErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error cancelling order:', err);
      return { success: false, error: err.message };
    }
  };

  const reactivateOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      const data = snap.exists() ? snap.data() : null;

      if (!data) return { success: false, error: 'Pedido no encontrado' };
      if (data.status !== 'cancelled') return { success: false, error: 'Solo se pueden reactivar pedidos cancelados' };

      const restoredStatus = ['preparing', 'ready'].includes(data.cancelledFromStatus)
        ? data.cancelledFromStatus
        : 'pending';

      await updateDoc(orderRef, {
        status: restoredStatus,
        cancelledAt: null,
        cancelledFromStatus: null,
        cancelledBy: null,
        cancelledByName: null,
        cancelledReason: null,
        reactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (data.deliveryId) {
        try {
          await updateDoc(doc(db, 'deliveries', data.deliveryId), {
            status: 'ready',
            updatedAt: serverTimestamp()
          });
        } catch (deliveryErr) {
          console.error('Error reactivating linked delivery:', deliveryErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error reactivating order:', err);
      return { success: false, error: err.message };
    }
  };

  // Mueve un pedido activo a otra mesa (solo pedidos en mesa)
  const transferOrder = async (orderId, table) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      const data = snap.exists() ? snap.data() : null;

      if (!data) return { success: false, error: 'Pedido no encontrado' };
      if (data.type && data.type !== 'table') {
        return { success: false, error: 'Solo se pueden trasladar pedidos en mesa' };
      }
      if (!['pending', 'preparing', 'ready'].includes(data.status)) {
        return { success: false, error: 'Solo se pueden trasladar pedidos activos' };
      }

      await updateDoc(orderRef, {
        tableId: table.id,
        tableNumber: table.number,
        transferredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, previousTableId: data.tableId || null };
    } catch (err) {
      console.error('Error transferring order:', err);
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
    updateOrder,
    cancelOrder,
    reactivateOrder,
    transferOrder
  };
}
