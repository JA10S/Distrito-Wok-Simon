import { findDuplicateOrder, isRecent, minutesAgo, DUPLICATE_WINDOW_MS } from './orderUtils';

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
