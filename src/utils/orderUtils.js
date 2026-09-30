export const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

export const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  delivering: 'En camino',
  delivered: 'Entregado'
};

export const ORDER_TYPE_LABELS = {
  table: '🍽️ En mesa',
  delivery: '🛵 Domicilio',
  pickup: '🥡 Para llevar'
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  nequi: 'Nequi',
  card: 'Tarjeta'
};

export const PAYMENT_METHOD_OPTIONS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'card', label: 'Tarjeta' }
];

export function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 0;

  // Formatos del menú: '30K', '30K / 40K' (primera porción), '$4.500', '4500', 4500
  const first = String(price).split('/')[0].trim();
  const kMatch = first.match(/^\$?\s*(\d+(?:[.,]\d+)?)\s*[kK]$/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
  }
  const digits = first.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function calculateTotals(items) {
  const subtotal = (items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.10);
  return { subtotal, tax, total: subtotal + tax };
}

export function validateCustomerInfo(orderType, customer) {
  if (orderType === 'table') return null;

  const data = customer || {};
  if (!data.name || !data.name.trim()) return 'Ingrese el nombre del cliente';
  if (!data.phone || String(data.phone).replace(/\D/g, '').length < 7) {
    return 'Ingrese un teléfono válido (mínimo 7 dígitos)';
  }
  if (orderType === 'delivery' && (!data.address || !data.address.trim())) {
    return 'Ingrese la dirección de entrega';
  }
  return null;
}

export function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
}

export function isRecent(timestamp, now = Date.now(), windowMs = DUPLICATE_WINDOW_MS) {
  const ms = timestampMs(timestamp);
  return ms > 0 && now - ms <= windowMs;
}

export function minutesAgo(timestamp, now = Date.now()) {
  const ms = timestampMs(timestamp);
  if (!ms) return null;
  return Math.max(0, Math.round((now - ms) / 60000));
}

function itemIdSet(items) {
  return new Set((items || []).map((item) => item.id).filter(Boolean));
}

export function findDuplicateOrder(newItems, cancelledOrders, now = Date.now()) {
  const newIds = itemIdSet(newItems);
  if (newIds.size === 0) return null;

  for (const order of cancelledOrders || []) {
    const cancelledMs = timestampMs(order.cancelledAt) || timestampMs(order.createdAt);
    if (!cancelledMs || now - cancelledMs > DUPLICATE_WINDOW_MS) continue;

    const otherIds = itemIdSet(order.items);
    if (otherIds.size === 0) continue;

    let shared = 0;
    newIds.forEach((id) => {
      if (otherIds.has(id)) shared += 1;
    });
    if (shared === 0) continue;

    const isEqual = shared === newIds.size && shared === otherIds.size;
    const isSubset = shared === Math.min(newIds.size, otherIds.size);
    const isSimilar = isEqual || isSubset || shared >= 2;

    if (isSimilar) {
      return {
        order,
        matchType: isEqual ? 'equal' : 'similar',
        minutesAgo: Math.round((now - cancelledMs) / 60000)
      };
    }
  }

  return null;
}
