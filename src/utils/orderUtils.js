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

export function getOrderLabel(order) {
  if (order.type && order.type !== 'table') {
    const label = ORDER_TYPE_LABELS[order.type] || order.type;
    return order.customer?.name ? `${label} · ${order.customer.name}` : label;
  }
  return `Mesa ${order.tableNumber || 'N/A'}`;
}

// '30K / 40K' → [{small, Pequeña, 30000}, {large, Grande, 40000}]; null si no hay doble porción
export function parsePriceOptions(price) {
  if (!price || typeof price === 'number') return null;
  const str = String(price);
  if (!str.includes('/')) return null;

  const [smallStr, largeStr] = str.split('/');
  const smallPrice = parsePrice(smallStr);
  const largePrice = parsePrice(largeStr);
  if (!smallPrice || !largePrice || smallPrice === largePrice) return null;

  return [
    { size: 'small', label: 'Pequeña', price: smallPrice },
    { size: 'large', label: 'Grande', price: largePrice }
  ];
}

// Normaliza un item del menú (+ variante de tamaño) a { id, name, price, size? }
export function resolveItemVariant(item, variant = null) {
  const info = variant || (parsePriceOptions(item.price) || [])[0];
  if (!info) {
    return { id: item.id, name: item.name, price: parsePrice(item.price) };
  }
  return {
    id: `${item.id}--${info.size}`,
    name: `${item.name} (${info.label})`,
    price: info.price,
    size: info.size
  };
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

export function isToday(timestamp, now = Date.now()) {
  const ms = timestampMs(timestamp);
  if (!ms) return false;
  const date = new Date(ms);
  const reference = new Date(now);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

// Platos más pedidos: agrupa por item base (ignora tamaño) de pedidos pagados
export function getTopItems(orders, limit = 5) {
  const counts = new Map();

  (orders || []).forEach((order) => {
    (order.items || []).forEach((item) => {
      const baseId = String(item.id || '').replace(/--(small|large)$/, '');
      if (!baseId) return;
      const baseName = String(item.name || '').replace(/\s*\((Pequeña|Grande)\)$/, '');
      const entry = counts.get(baseId) || { id: baseId, name: baseName, count: 0 };
      entry.count += item.quantity || 0;
      counts.set(baseId, entry);
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
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

// Ignora el sufijo de tamaño (--small/--large) para comparar contra el item base del menú
function itemIdSet(items) {
  return new Set(
    (items || [])
      .map((item) => String(item.id || '').replace(/--(small|large)$/, ''))
      .filter(Boolean)
  );
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
