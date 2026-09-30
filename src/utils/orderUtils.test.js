import {
  findDuplicateOrder,
  isRecent,
  minutesAgo,
  DUPLICATE_WINDOW_MS,
  parsePrice,
  calculateTotals,
  validateCustomerInfo
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
  test('calcula subtotal, IVA 10% y total', () => {
    const items = [
      { price: 30000, quantity: 2 },
      { price: 4000, quantity: 1 }
    ];
    const totals = calculateTotals(items);

    expect(totals.subtotal).toBe(64000);
    expect(totals.tax).toBe(6400);
    expect(totals.total).toBe(70400);
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
    expect(validateCustomerInfo('delivery', { ...valid, address: '' })).toMatch(/dirección/i);
  });
});
