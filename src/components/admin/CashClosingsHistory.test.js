import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CashClosingsHistory from './CashClosingsHistory';
import { useCashClosings } from '../../hooks/useCashClosing';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../contexts/AuthContext';
import { downloadXlsx } from '../../utils/exportUtils';

jest.mock('../../hooks/useCashClosing', () => ({
  useCashClosings: jest.fn(),
  useCashClosing: () => ({ closing: null, loading: false, error: null, closeRegister: () => Promise.resolve({ success: true }) }),
  dayKey: () => '2026-10-18',
  closingTime: () => '10:30 p. m.'
}));

jest.mock('../../hooks/useOrders', () => ({
  useOrders: jest.fn()
}));

jest.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({ expenses: [] })
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// ExportUtils real (builders) + downloadXlsx espiado
jest.mock('../../utils/exportUtils', () => {
  const actual = jest.requireActual('../../utils/exportUtils');
  return { ...actual, downloadXlsx: jest.fn() };
});

let mockClosings;
let mockHasPermission;

const makeClosing = (overrides = {}) => ({
  id: '2026-10-17',
  date: '2026-10-17',
  closedAt: null,
  closedBy: 'admin@distritowok.com',
  countedCash: 44000,
  difference: -1000,
  notes: 'Sin novedades',
  summary: {
    totalSales: 120000,
    cash: 50000,
    transfer: 30000,
    card: 20000,
    bold: 20000,
    expenses: 6000,
    cashExpenses: 6000,
    cashExpected: 44000,
    ordersCount: 5,
    avgTicket: 24000
  },
  ...overrides
});

beforeEach(() => {
  mockClosings = [makeClosing()];
  mockHasPermission = jest.fn(() => true);

  useCashClosings.mockReturnValue({ closings: mockClosings, loading: false, error: null });
  useOrders.mockReturnValue({
    orders: [
      {
        id: 'new002',
        createdAt: new Date(2026, 9, 17, 19, 45),
        total: 30000,
        paymentMethod: 'transfer',
        type: 'delivery',
        customer: { name: 'Ana' }
      },
      {
        id: 'old001',
        createdAt: new Date(2026, 9, 17, 12, 0),
        total: 50000,
        paymentMethod: 'cash',
        type: 'table',
        tableNumber: 3
      }
    ],
    loading: false
  });
  useAuth.mockReturnValue({
    currentUser: { uid: 'u1', email: 'admin@distritowok.com' },
    hasPermission: mockHasPermission
  });
  downloadXlsx.mockClear();
});

describe('CashClosingsHistory — exportación Excel', () => {
  test('descarga el Excel con las hojas Cierres y Ventas', () => {
    render(<CashClosingsHistory />);
    expect(useCashClosings).toHaveBeenCalledWith(365);

    fireEvent.click(screen.getByRole('button', { name: /Exportar Excel/ }));

    expect(downloadXlsx).toHaveBeenCalledTimes(1);
    const [sheets, filename] = downloadXlsx.mock.calls[0];
    expect(filename).toBe('cierres-caja-2026-10-18.xlsx');
    expect(sheets.map((s) => s.name)).toEqual(['Cierres', 'Ventas']);

    const summaryRows = sheets[0].rows;
    expect(summaryRows).toHaveLength(1);
    expect(summaryRows[0].Fecha).toBe('2026-10-17');
    expect(summaryRows[0]['Efectivo contado']).toBe(44000);
    expect(summaryRows[0].Diferencia).toBe(-1000);

    const salesRows = sheets[1].rows;
    expect(salesRows).toHaveLength(2);
    expect(salesRows[0].Pedido).toBe('#NEW002');
    expect(salesRows[0].Total).toBe(30000);
    expect(salesRows[1].Tipo).toBe('Mesa 3');
  });

  test('oculta el botón sin permiso cash_register', () => {
    useAuth.mockReturnValue({
      currentUser: { uid: 'u1', email: 'admin@distritowok.com' },
      hasPermission: (p) => p !== 'cash_register'
    });
    render(<CashClosingsHistory />);

    expect(screen.getByText('Historial de cierres')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exportar Excel/ })).not.toBeInTheDocument();
  });

  test('oculta el botón y muestra estado vacío si no hay cierres', () => {
    mockClosings = [];
    useCashClosings.mockReturnValue({ closings: [], loading: false, error: null });
    render(<CashClosingsHistory />);

    expect(screen.queryByRole('button', { name: /Exportar Excel/ })).not.toBeInTheDocument();
    expect(screen.getByText('Aún no hay cierres de caja registrados')).toBeInTheDocument();
  });

  test('deshabilita el botón mientras cargan los pedidos', () => {
    useOrders.mockReturnValue({ orders: [], loading: true });
    render(<CashClosingsHistory />);

    expect(screen.getByRole('button', { name: /Exportar Excel/ })).toBeDisabled();
  });
});
