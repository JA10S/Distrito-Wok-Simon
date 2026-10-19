const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockHasPermission = jest.fn();
const mockLogout = jest.fn();
const mockProcessPayment = jest.fn();
const mockRegisterCredit = jest.fn();

let mockReadyOrders = [];
let mockPaidOrders = [];
let mockExpenses = [];
let mockCustomers = [];

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'u1', email: 'cajero@distritowok.com' },
    hasPermission: (p) => mockHasPermission(p),
    logout: mockLogout,
  }),
}));

jest.mock('../../hooks/useOrders', () => ({
  useOrders: (status) => ({
    orders: status === 'ready' ? mockReadyOrders : mockPaidOrders,
    loading: false,
    error: null,
    processPayment: mockProcessPayment,
  }),
}));

jest.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: mockExpenses,
    loading: false,
    error: null,
    addExpense: jest.fn(),
    deleteExpense: jest.fn(),
  }),
}));

let mockClosing = null;
const mockCloseRegister = jest.fn();

jest.mock('../../hooks/useCashClosing', () => ({
  useCashClosing: () => ({
    closing: mockClosing,
    loading: false,
    error: null,
    closeRegister: mockCloseRegister,
  }),
  closingTime: () => '10:30 p. m.',
  dayKey: () => '2026-10-04',
}));

jest.mock('../../hooks/useCredit', () => ({
  useCredit: () => ({
    customers: mockCustomers,
    transactions: [],
    loading: false,
    totalCredit: 0,
    addCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
    registerCredit: mockRegisterCredit,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CashierDashboard from './CashierDashboard';

const buildReadyOrders = () => [
  {
    id: 'readyOrder1',
    type: 'table',
    tableNumber: 5,
    status: 'ready',
    items: [{ name: 'Arroz Costeño Wok', price: 30000, quantity: 2 }],
    notes: 'Sin cebolla',
    subtotal: 60000,
    tax: 6000,
    total: 66000,
  },
  {
    id: 'readyOrder2',
    type: 'delivery',
    customer: { name: 'Juan Pérez', phone: '3001234567', address: 'Calle 45 #12-34' },
    preferredPayment: 'nequi',
    status: 'ready',
    items: [{ name: 'Gaseosa', price: 5000, quantity: 1 }],
    subtotal: 5000,
    tax: 500,
    total: 5500,
  },
];

const buildPaidOrders = () => [
  { id: 'paidOrder1', type: 'table', tableNumber: 1, total: 66000, paymentMethod: 'cash', createdAt: new Date() },
  { id: 'paidOrder2', type: 'table', tableNumber: 2, total: 33000, paymentMethod: 'nequi', createdAt: new Date() },
  { id: 'paidOrder3', type: 'delivery', customer: { name: 'Ana' }, total: 44000, paymentMethod: 'card', createdAt: new Date() },
  { id: 'paidOrder4', type: 'pickup', customer: { name: 'Luis' }, total: 10000, paymentMethod: 'bold', createdAt: new Date() },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockReadyOrders = buildReadyOrders();
  mockPaidOrders = buildPaidOrders();
  mockExpenses = [];
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 0 }];
  mockClosing = null;
  mockHasPermission.mockImplementation(() => false);
  mockProcessPayment.mockImplementation(() => Promise.resolve({ success: true }));
  mockCloseRegister.mockImplementation(() => Promise.resolve({ success: true }));
  mockRegisterCredit.mockImplementation(() => Promise.resolve({ success: true, newBalance: 66000 }));
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
});

test('muestra los pedidos listos para cobrar con label, notas y total', () => {
  render(<CashierDashboard />);

  expect(screen.getByText('Pedidos para Cobrar (2)')).toBeInTheDocument();
  expect(screen.getByText('Mesa 5')).toBeInTheDocument();
  expect(screen.getByText(/🛵 Domicilio · Juan Pérez/)).toBeInTheDocument();
  expect(screen.getAllByText('Listo para cobrar')).toHaveLength(2);
  expect(screen.getByText('Sin cebolla')).toBeInTheDocument();
  expect(screen.getByText(`$${(66000).toLocaleString()}`)).toBeInTheDocument();
});

test('muestra el estado vacío cuando no hay pedidos pendientes de pago', () => {
  mockReadyOrders = [];

  render(<CashierDashboard />);

  expect(screen.getByText('No hay pedidos pendientes de pago')).toBeInTheDocument();
});

test('procesa el pago con el método seleccionado', async () => {
  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'cash' } });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(mockProcessPayment).toHaveBeenCalledWith(
      'readyOrder1',
      'cash',
      expect.objectContaining({ uid: 'u1' }),
      null
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Pago procesado exitosamente');
});

test('avisa si no se seleccionó método de pago', async () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Seleccione un método de pago')
  );
  expect(mockProcessPayment).not.toHaveBeenCalled();
});

test('muestra el error cuando el pago falla', async () => {
  mockProcessPayment.mockImplementation(() =>
    Promise.resolve({ success: false, error: 'Fondos insuficientes' })
  );

  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'card' } });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      'Error al procesar pago: Fondos insuficientes'
    )
  );
});

test('muestra teléfono, dirección y pago preferido en pedidos para llevar', () => {
  render(<CashierDashboard />);

  expect(screen.getByText(/3001234567/)).toBeInTheDocument();
  expect(screen.getByText(/📍 Calle 45 #12-34/)).toBeInTheDocument();
  expect(screen.getByText(/Pago: Nequi/)).toBeInTheDocument();
});

test('muestra el historial de ventas con el método de pago traducido', () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Historial' }));

  expect(screen.getByText('Historial de Ventas')).toBeInTheDocument();
  expect(screen.getByText('Mesa 1')).toBeInTheDocument();
  expect(screen.getByText(/🛵 Domicilio · Ana/)).toBeInTheDocument();
  expect(screen.getByText('Efectivo')).toBeInTheDocument();
  expect(screen.getByText('Nequi Directo')).toBeInTheDocument();
  expect(screen.getByText('Tarjeta Crédito/Débito')).toBeInTheDocument();
  expect(screen.getByText('Bold (Nequi/Tarjeta)')).toBeInTheDocument();
  expect(screen.getByText(`$${(66000).toLocaleString()}`)).toBeInTheDocument();
});

test('muestra el detalle de una venta del historial al expandirlo', () => {
  mockPaidOrders = [
    {
      id: 'paidDetail1',
      type: 'table',
      tableNumber: 4,
      status: 'paid',
      items: [{ name: 'Arroz Chaufa (Grande)', price: 40000, quantity: 2 }],
      notes: 'Poco picante',
      subtotal: 80000,
      tax: 0,
      total: 80000,
      paymentMethod: 'cash',
      createdAt: new Date(),
    },
  ];

  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Historial' }));

  expect(
    screen.queryByRole('group', { name: 'Detalle del pedido' })
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Ver detalle/ }));

  const detail = screen.getByRole('group', { name: 'Detalle del pedido' });
  expect(within(detail).getByText(/2x Arroz Chaufa \(Grande\)/)).toBeInTheDocument();
  expect(within(detail).getByText('Poco picante')).toBeInTheDocument();
  expect(within(detail).getByText('Subtotal:')).toBeInTheDocument();
  expect(within(detail).getByText('IVA (incluido):')).toBeInTheDocument();
  expect(within(detail).getByText('Total:')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Ocultar detalle/ }));
  expect(
    screen.queryByRole('group', { name: 'Detalle del pedido' })
  ).not.toBeInTheDocument();
});

test('muestra el cuadre de caja con los totales por método de pago', () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText('Resumen del Día')).toBeInTheDocument();
  expect(screen.getByText(`$${(153000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('Transferencia:')).toBeInTheDocument();
  expect(screen.getAllByText(`$${(66000).toLocaleString()}`).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(`$${(43000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(`$${(44000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('Gastos Caja Menor:')).toBeInTheDocument();
  expect(screen.getByText(`−$${(0).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('Efectivo Esperado:')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText(`$${Math.round(153000 / 4).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('Cerrar Caja')).toBeInTheDocument();
});

test('resta los gastos de caja menor del efectivo esperado', () => {
  mockExpenses = [
    { id: 'e1', concept: 'Sillas', amount: 10000, method: 'cash', createdAt: new Date() },
    { id: 'e2', concept: 'Flete Nequi', amount: 5000, method: 'nequi', createdAt: new Date() },
  ];

  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText('Gastos Caja Menor:')).toBeInTheDocument();
  expect(screen.getAllByText(`−$${(15000).toLocaleString()}`)).toHaveLength(2); // resumen + total de compras
  expect(screen.getByText('Efectivo Esperado:')).toBeInTheDocument();
  expect(screen.getByText(`$${(66000 - 10000).toLocaleString()}`)).toBeInTheDocument();
});

test('muestra el estado vacío del historial sin ventas registradas', () => {
  mockPaidOrders = [];

  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Historial' }));

  expect(screen.getByText('No hay ventas registradas hoy')).toBeInTheDocument();
});

test('oculta los resúmenes sin permiso view_summaries', () => {
  render(<CashierDashboard />);

  expect(screen.queryByText('Por cobrar')).not.toBeInTheDocument();
  expect(screen.queryByText('Cobrado hoy')).not.toBeInTheDocument();
  expect(screen.queryByText('Pagados hoy')).not.toBeInTheDocument();
});

test('muestra los resúmenes con permiso view_summaries', () => {
  mockHasPermission.mockImplementation((p) => p === 'view_summaries');

  render(<CashierDashboard />);

  expect(screen.getByText('Por cobrar')).toBeInTheDocument();
  expect(screen.getByText('Cobrado hoy')).toBeInTheDocument();
  expect(screen.getByText('Pagados hoy')).toBeInTheDocument();
  expect(screen.getByText('Total pagados')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getAllByText('4').length).toBeGreaterThan(0);
});

test('ofrece el botón de volver al admin solo con permiso view_dashboard', () => {
  const { rerender } = render(<CashierDashboard />);

  expect(screen.queryByRole('button', { name: /Admin/ })).not.toBeInTheDocument();

  mockHasPermission.mockImplementation((p) => p === 'view_dashboard');
  rerender(<CashierDashboard />);

  expect(screen.getByRole('button', { name: /Admin/ })).toBeInTheDocument();
});

test('procesa un pago mixto con las partes en efectivo y transferencia', async () => {
  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'mixed' } });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '40000' } });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(mockProcessPayment).toHaveBeenCalledWith(
      'readyOrder1',
      'mixed',
      expect.objectContaining({ uid: 'u1' }),
      { cash: 40000, transfer: 26000 }
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Pago procesado exitosamente');
});

test('no procesa el pago mixto sin la parte en efectivo', async () => {
  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'mixed' } });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese la parte pagada en efectivo')
  );
  expect(mockProcessPayment).not.toHaveBeenCalled();
});

test('muestra el pago mixto en el historial con cada parte', () => {
  mockPaidOrders = [
    {
      id: 'mixedOrder1',
      type: 'table',
      tableNumber: 3,
      total: 50000,
      paymentMethod: 'mixed',
      paymentSplit: { cash: 20000, transfer: 30000 },
      createdAt: new Date(),
    },
  ];

  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Historial' }));

  expect(
    screen.getByText('Mixto: Efectivo $20.000 + Transferencia $30.000')
  ).toBeInTheDocument();
});

test('refleja pagos mixtos y transferencias en el cuadre', () => {
  mockPaidOrders = [
    { id: 'p1', type: 'table', tableNumber: 1, total: 100000, paymentMethod: 'cash', createdAt: new Date() },
    { id: 'p2', type: 'table', tableNumber: 2, total: 50000, paymentMethod: 'transfer', createdAt: new Date() },
    {
      id: 'p3', type: 'pickup', total: 60000, paymentMethod: 'mixed',
      paymentSplit: { cash: 25000, transfer: 35000 }, createdAt: new Date(),
    },
  ];
  mockExpenses = [
    { id: 'e1', concept: 'Sillas', amount: 15000, method: 'mixed', paymentSplit: { cash: 5000, transfer: 10000 }, createdAt: new Date() },
  ];

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText(`$${(210000).toLocaleString()}`)).toBeInTheDocument(); // total ventas
  expect(screen.getByText(`$${(125000).toLocaleString()}`)).toBeInTheDocument(); // efectivo: 100000 + 25000
  expect(screen.getByText(`$${(85000).toLocaleString()}`)).toBeInTheDocument(); // transferencia: 50000 + 35000
  expect(screen.getAllByText(`−$${(15000).toLocaleString()}`)).toHaveLength(3); // gasto, total de compras y fila del resumen
  expect(screen.getByText(`$${(125000 - 5000).toLocaleString()}`)).toBeInTheDocument(); // efectivo esperado
});

test('calcula la diferencia del arqueo al ingresar el efectivo contado', () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByRole('status')).toHaveTextContent('\u2014');

  fireEvent.change(screen.getByLabelText(/Efectivo contado/), { target: { value: '70000' } });
  expect(
    screen.getByText(`Sobrante: $${(4000).toLocaleString()}`)
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Efectivo contado/), { target: { value: '60000' } });
  expect(
    screen.getByText(`Faltante: $${(-6000).toLocaleString()}`)
  ).toBeInTheDocument();
});

test('cierra la caja con el efectivo contado y guarda el resumen del día', async () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));
  fireEvent.change(screen.getByLabelText(/Efectivo contado/), { target: { value: '70000' } });
  fireEvent.change(screen.getByLabelText(/Notas del cierre/), {
    target: { value: 'Cambio entregado bien' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockCloseRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        countedCash: 70000,
        notes: 'Cambio entregado bien',
        user: expect.objectContaining({ uid: 'u1' }),
        summary: expect.objectContaining({
          totalSales: 153000,
          cash: 66000,
          cashExpected: 66000,
          ordersCount: 4,
        }),
      })
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Caja cerrada exitosamente');
});

test('valida que se ingrese el efectivo contado antes de cerrar', async () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese el efectivo contado en la gaveta')
  );
  expect(mockCloseRegister).not.toHaveBeenCalled();
});

test('no cierra la caja si se cancela la confirmación', async () => {
  window.confirm.mockImplementation(() => false);

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));
  fireEvent.change(screen.getByLabelText(/Efectivo contado/), { target: { value: '66000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }));

  await waitFor(() => expect(window.confirm).toHaveBeenCalled());
  expect(mockCloseRegister).not.toHaveBeenCalled();
});

test('muestra el cierre existente y permite actualizarlo', async () => {
  mockClosing = {
    id: '2026-10-04',
    date: '2026-10-04',
    countedCash: 65000,
    difference: -1000,
    notes: 'Revisar cambio',
    closedBy: 'cajero@distritowok.com',
    closedAt: null,
    summary: { cashExpected: 66000 },
  };

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText(/Caja cerrada el 2026-10-04/)).toBeInTheDocument();
  expect(screen.getByText(/por cajero@distritowok\.com/)).toBeInTheDocument();
  expect(screen.getByText(/🗒️ Revisar cambio/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Efectivo contado/)).toHaveValue(65000);
  expect(screen.queryByRole('button', { name: 'Cerrar Caja' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Actualizar Cierre' }));

  await waitFor(() =>
    expect(mockCloseRegister).toHaveBeenCalledWith(
      expect.objectContaining({ countedCash: 65000, notes: 'Revisar cambio' })
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Cierre de caja actualizado');
});

test('muestra el error cuando el cierre falla', async () => {
  mockCloseRegister.mockImplementation(() =>
    Promise.resolve({ success: false, error: 'Permiso denegado' })
  );

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));
  fireEvent.change(screen.getByLabelText(/Efectivo contado/), { target: { value: '66000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Error al cerrar caja: Permiso denegado')
  );
});

test('lista las compras del día en el arqueo de cierre', () => {
  mockExpenses = [
    { id: 'e1', concept: 'Pago goyo', amount: 40000, method: 'cash', createdAt: new Date() },
    { id: 'e2', concept: 'Vigilancia', amount: 10000, method: 'cash', createdAt: new Date() },
  ];

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText('Compras del día (2)')).toBeInTheDocument();
  expect(screen.getByText('Pago goyo')).toBeInTheDocument();
  expect(screen.getByText('Vigilancia')).toBeInTheDocument();
  expect(screen.getByText('Total compras')).toBeInTheDocument();

  const money = new RegExp(`\\u2212\\$${(50000).toLocaleString()}`);
  expect(screen.getAllByText(money)).toHaveLength(2); // gasto del resumen + total del listado
});

test('muestra el estado vacío de compras cuando no hay gastos hoy', () => {
  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText('Compras del día (0)')).toBeInTheDocument();
  expect(screen.getByText('No hay compras registradas hoy')).toBeInTheDocument();
});

test('ofrece el método fiado y pide elegir cliente', () => {
  render(<CashierDashboard />);

  const select = screen.getAllByRole('combobox')[0];
  fireEvent.change(select, { target: { value: 'fiado' } });

  expect(screen.getByText('Cliente a quien fiarle *')).toBeInTheDocument();
  expect(screen.getByText(/María Pérez · saldo/)).toBeInTheDocument();
});

test('no procesa el fiado sin elegir cliente', async () => {
  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'fiado' } });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Seleccione el cliente a quien fiarle')
  );
  expect(mockProcessPayment).not.toHaveBeenCalled();
});

test('procesa el pago fiado y registra el movimiento en la cartera', async () => {
  render(<CashierDashboard />);

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'fiado' } });
  fireEvent.change(screen.getByRole('combobox', { name: /Cliente a quien fiarle/ }), {
    target: { value: 'c1' },
  });
  fireEvent.click(screen.getAllByText('Procesar Pago')[0]);

  await waitFor(() =>
    expect(mockProcessPayment).toHaveBeenCalledWith(
      'readyOrder1',
      'fiado',
      expect.objectContaining({ uid: 'u1' }),
      null
    )
  );
  await waitFor(() => expect(mockRegisterCredit).toHaveBeenCalledTimes(1));
  expect(mockRegisterCredit).toHaveBeenCalledWith(
    expect.objectContaining({ customerId: 'c1', type: 'fiado', amount: 66000, orderId: 'readyOrder1' })
  );
  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Fiado registrado a María Pérez')
  );
});

test('muestra Fiado en el historial de ventas', () => {
  mockPaidOrders = [
    { id: 'pf1', type: 'table', tableNumber: 3, total: 50000, paymentMethod: 'fiado', createdAt: new Date() },
  ];

  render(<CashierDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Historial' }));

  expect(screen.getByText('Fiado')).toBeInTheDocument();
});
