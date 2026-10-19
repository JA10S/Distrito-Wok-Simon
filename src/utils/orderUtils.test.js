import {
  findDuplicateOrder,
  isRecent,
  isToday,
  getTopItems,
  minutesAgo,
  DUPLICATE_WINDOW_MS,
  parsePrice,
  calculateTotals,
  validateCustomerInfo,
  getPaymentParts,
  formatPaymentDetail,
  PAYMENT_METHOD_LABELS,
  computeDayTotals,
  parseDayKey
} from './orderUtils';

const now = Date.now();
const recentCancelledAt = { toDate: () => new Date(now - 8 * 60000) };
const oldCancelledAt = { toDate: () => new Date(now - 60 * 60000) };

const cancelledOrder = (items, cancelledAt = recentCancelledAt) => ({
  id: 'c1',
  tableNumber: 3,
  status: 'cancelled',
  cancelledFromStatus: 'preparing',
  cancelledAt,
  items
});

describe('findDuplicateOrder', () => {
  const arroz = { id: 'm1', name: 'Arroz Costeño Wok', price: 30000, quantity: 1 };
  const pollo = { id: 'm2', name: 'Pollo Broaster', price: 25000, quantity: 1 };
  const gaseosa = { id: 'm3', name: 'Gaseosa', price: 4000, quantity: 2 };

  test('detecta pedido identico cancelado hace poco', () => {
    const result = findDuplicateOrder(
      [arroz, pollo],
      [cancelledOrder([arroz, pollo])],
      now
    );

    expect(result).not.toBeNull();
    expect(result.matchType).toBe('equal');
    expect(result.minutesAgo).toBe(8);
    expect(result.order.tableNumber).toBe(3);
  });

  test('detecta pedido similar (subconjunto)', () => {
    const result = findDuplicateOrder(
      [arroz, pollo, gaseosa],
      [cancelledOrder([arroz, pollo])],
      now
    );

    expect(result).not.toBeNull();
    expect(result.matchType).toBe('similar');
  });

  test('ignora cancelaciones fuera de la ventana de 30 minutos', () => {
    const result = findDuplicateOrder(
      [arroz, pollo],
      [cancelledOrder([arroz, pollo], oldCancelledAt)],
      now
    );

    expect(result).toBeNull();
  });

  test('no detecta coincidencias con items distintos', () => {
    const result = findDuplicateOrder(
      [gaseosa],
      [cancelledOrder([arroz, pollo])],
      now
    );

    expect(result).toBeNull();
  });

  test('retorna null sin items o sin cancelados', () => {
    expect(findDuplicateOrder([], [cancelledOrder([arroz])], now)).toBeNull();
    expect(findDuplicateOrder([arroz], [], now)).toBeNull();
    expect(findDuplicateOrder([arroz], null, now)).toBeNull();
  });
});

describe('utilidades de tiempo', () => {
  test('isRecent respeta la ventana', () => {
    expect(isRecent(recentCancelledAt, now)).toBe(true);
    expect(isRecent(oldCancelledAt, now)).toBe(false);
    expect(isRecent(null, now)).toBe(false);
  });

  test('minutesAgo calcula minutos redondeados', () => {
    expect(minutesAgo(recentCancelledAt, now)).toBe(8);
    expect(minutesAgo(null, now)).toBeNull();
  });

  test('la ventana de duplicados es de 30 minutos', () => {
    expect(DUPLICATE_WINDOW_MS).toBe(30 * 60 * 1000);
  });
});

describe('parsePrice', () => {
  test('convierte precios con K a pesos', () => {
    expect(parsePrice('30K / 40K')).toBe(30000);
    expect(parsePrice('12K')).toBe(12000);
  });

  test('retorna 0 sin precio', () => {
    expect(parsePrice(null)).toBe(0);
    expect(parsePrice('')).toBe(0);
  });

  test('interpreta precios con signo dólar y puntos de mil', () => {
    expect(parsePrice('$4.500')).toBe(4500);
    expect(parsePrice('$35.000')).toBe(35000);
    expect(parsePrice('4500')).toBe(4500);
  });

  test('acepta precios numéricos sin multiplicar', () => {
    expect(parsePrice(4500)).toBe(4500);
    expect(parsePrice(30000)).toBe(30000);
  });

  test('toma la primera porción de precios dobles', () => {
    expect(parsePrice('30K / 40K')).toBe(30000);
    expect(parsePrice('$4.500 / $6.500')).toBe(4500);
  });
});

describe('calculateTotals', () => {
  test('calcula subtotal y total sin IVA extra (precio final = precio del menú)', () => {
    const items = [
      { price: 30000, quantity: 2 },
      { price: 4000, quantity: 1 }
    ];
    const totals = calculateTotals(items);

    expect(totals.subtotal).toBe(64000);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(64000);
  });

  test('sin items retorna ceros', () => {
    expect(calculateTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe('validateCustomerInfo', () => {
  const valid = { name: 'Juan Pérez', phone: '3001234567', address: 'Calle 45 #12-34' };

  test('pedido en mesa no requiere datos', () => {
    expect(validateCustomerInfo('table', {})).toBeNull();
  });

  test('pedido válido para domicilio', () => {
    expect(validateCustomerInfo('delivery', valid)).toBeNull();
  });

  test('pedido válido para recoger (sin dirección)', () => {
    expect(validateCustomerInfo('pickup', { name: 'Ana', phone: '3001234567' })).toBeNull();
  });

  test('requiere nombre', () => {
    expect(validateCustomerInfo('delivery', { ...valid, name: '  ' })).toMatch(/nombre/i);
  });

  test('requiere teléfono válido', () => {
    expect(validateCustomerInfo('delivery', { ...valid, phone: '123' })).toMatch(/teléfono/i);
  });

  test('domicilio requiere dirección', () => {
    expect(validateCustomerInfo('delivery', { ...valid, address: '' })).toMatch(/dirección/);
  });
});

describe('isToday', () => {
  test('detecta un timestamp de hoy', () => {
    expect(isToday({ toDate: () => new Date() })).toBe(true);
  });

  test('descarta un timestamp de otro día', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(isToday({ toDate: () => yesterday })).toBe(false);
  });

  test('descarta valores vacíos', () => {
    expect(isToday(null)).toBe(false);
    expect(isToday(undefined)).toBe(false);
  });
});

describe('getTopItems', () => {
  const order = (items) => ({ items });

  test('agrupa por item base ignorando el tamaño', () => {
    const top = getTopItems([
      order([
        { id: 'a1--small', name: 'Arroz Costeño Wok (Pequeña)', quantity: 1 },
        { id: 'b1', name: 'Gaseosa', quantity: 2 }
      ]),
      order([{ id: 'a1--large', name: 'Arroz Costeño Wok (Grande)', quantity: 2 }])
    ]);

    expect(top).toEqual([
      { id: 'a1', name: 'Arroz Costeño Wok', count: 3 },
      { id: 'b1', name: 'Gaseosa', count: 2 }
    ]);
  });

  test('ordena por cantidad y respeta el límite', () => {
    const top = getTopItems(
      [
        order([{ id: 'x1', name: 'A', quantity: 1 }]),
        order([{ id: 'y1', name: 'B', quantity: 5 }]),
        order([{ id: 'z1', name: 'C', quantity: 3 }])
      ],
      2
    );

    expect(top.map((i) => i.id)).toEqual(['y1', 'z1']);
  });

  test('retorna lista vacía sin pedidos ni items', () => {
    expect(getTopItems([])).toEqual([]);
    expect(getTopItems(undefined)).toEqual([]);
    expect(getTopItems([{}])).toEqual([]);
  });
});

describe('getPaymentParts', () => {
  test('pago en efectivo va todo al efectivo', () => {
    expect(getPaymentParts('cash', 50000)).toEqual({ cash: 50000, transfer: 0, card: 0, other: 0 });
  });

  test('pago en transferencia va todo a transferencia', () => {
    expect(getPaymentParts('transfer', 50000)).toEqual({ cash: 0, transfer: 50000, card: 0, other: 0 });
  });

  test('pago en tarjeta va todo a tarjeta', () => {
    expect(getPaymentParts('card', 50000)).toEqual({ cash: 0, transfer: 0, card: 50000, other: 0 });
  });

  test('Bold y Nequi van a otros (Bold/Nequi)', () => {
    expect(getPaymentParts('bold', 30000)).toEqual({ cash: 0, transfer: 0, card: 0, other: 30000 });
    expect(getPaymentParts('nequi', 30000)).toEqual({ cash: 0, transfer: 0, card: 0, other: 30000 });
  });

  test('pago mixto se divide en efectivo y transferencia', () => {
    expect(getPaymentParts('mixed', 60000, { cash: 25000, transfer: 35000 })).toEqual({
      cash: 25000,
      transfer: 35000,
      card: 0,
      other: 0,
    });
  });

  test('mixed sin split no pierde el total (other absorbe el resto)', () => {
    const parts = getPaymentParts('mixed', 60000, null);
    expect(parts.cash + parts.transfer + parts.card + parts.other).toBe(60000);
  });
});

describe('formatPaymentDetail', () => {
  test('muestra el label del método simple', () => {
    expect(formatPaymentDetail('cash')).toBe(PAYMENT_METHOD_LABELS.cash);
    expect(formatPaymentDetail('transfer')).toBe('Transferencia');
    expect(formatPaymentDetail('card')).toBe('Tarjeta');
    expect(formatPaymentDetail('nequi')).toBe('Nequi');
    expect(formatPaymentDetail('bold')).toBe('Bold (Nequi/Tarjeta)');
  });

  test('muestra cada parte de un pago mixto', () => {
    expect(formatPaymentDetail('mixed', { cash: 20000, transfer: 30000 })).toBe(
      'Mixto: Efectivo $20.000 + Transferencia $30.000'
    );
  });

  test('mixed sin split cae al label genérico', () => {
    expect(formatPaymentDetail('mixed')).toBe('Mixto (Efectivo + Transferencia)');
  });

  test('método desconocido o vacío no rompe', () => {
    expect(formatPaymentDetail('other')).toBe('other');
    expect(formatPaymentDetail('')).toBe('—');
    expect(formatPaymentDetail(undefined)).toBe('—');
  });
});

describe('computeDayTotals', () => {
  const dayTs = (y, m, d, hh = 12, mm = 0) => ({
    toDate: () => new Date(y, m - 1, d, hh, mm)
  });

  test('solo suma pedidos y gastos del día pedido', () => {
    const orders = [
      { total: 40000, paymentMethod: 'cash', createdAt: dayTs(2026, 10, 2, 13) },
      { total: 60000, paymentMethod: 'transfer', createdAt: dayTs(2026, 10, 2, 20) },
      { total: 30000, paymentMethod: 'cash', createdAt: dayTs(2026, 10, 3, 12) }
    ];
    const expenses = [
      { amount: 15000, method: 'cash', createdAt: dayTs(2026, 10, 2, 18) },
      { amount: 9000, method: 'cash', createdAt: dayTs(2026, 10, 3, 9) }
    ];

    const t = computeDayTotals(orders, expenses, '2026-10-02');

    expect(t.ordersCount).toBe(2);
    expect(t.totalSales).toBe(100000);
    expect(t.cash).toBe(40000);
    expect(t.transfer).toBe(60000);
    expect(t.expenseTotal).toBe(15000);
    expect(t.cashExpenseTotal).toBe(15000);
    expect(t.cashExpected).toBe(25000);
    expect(t.avgTicket).toBe(50000);
    expect(t.paidOrders).toHaveLength(2);
    expect(t.dayExpenses).toHaveLength(1);
  });

  test('acepta un objeto Date y listas vacías sin romper', () => {
    const t = computeDayTotals([], [], new Date(2026, 9, 5));
    expect(t.ordersCount).toBe(0);
    expect(t.totalSales).toBe(0);
    expect(t.cashExpected).toBe(0);
    expect(t.avgTicket).toBe(0);
    expect(t.dayExpenses).toEqual([]);
  });

  test('lo de las 00:00 del día siguiente queda fuera', () => {
    const nextDay = { toDate: () => new Date(2026, 9, 3, 0, 0, 1) };
    const lastMinute = { toDate: () => new Date(2026, 9, 2, 23, 59, 59) };
    const t = computeDayTotals(
      [
        { total: 10000, paymentMethod: 'cash', createdAt: lastMinute },
        { total: 20000, paymentMethod: 'cash', createdAt: nextDay }
      ],
      [],
      '2026-10-02'
    );
    expect(t.ordersCount).toBe(1);
    expect(t.totalSales).toBe(10000);
  });
});

describe('parseDayKey', () => {
  test('parsea YYYY-MM-DD como fecha local (sin desfase UTC)', () => {
    const d = parseDayKey('2026-10-02');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(2);
  });
});
