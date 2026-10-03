const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockHasPermission = jest.fn();
const mockLogout = jest.fn();
const mockUpdateTableStatus = jest.fn();
const mockCreateOrder = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockUpdateOrder = jest.fn();
const mockCancelOrder = jest.fn();
const mockReactivateOrder = jest.fn();
const mockProcessPayment = jest.fn();
const mockTransferOrder = jest.fn();
const mockResolveCall = jest.fn();
const mockCloseShift = jest.fn();
let mockPendingCalls = [];
let mockShift = null;

const mockTables = [
  { id: 't1', number: 1, capacity: 4, status: 'available', occupiedAt: null },
  { id: 't2', number: 2, capacity: 2, status: 'occupied', occupiedAt: null },
  { id: 't3', number: 3, capacity: 4, status: 'occupied', occupiedAt: null },
  { id: 't4', number: 4, capacity: 4, status: 'available', occupiedAt: null },
];

const recentCancelledAt = { toDate: () => new Date(Date.now() - 8 * 60000) };

const mockOrders = [
  {
    id: 'order1',
    tableId: 't3',
    tableNumber: 3,
    status: 'pending',
    items: [{ id: 'i1', name: 'Arroz Costeño Wok', price: 30000, quantity: 2 }],
    notes: 'Sin cebolla',
    subtotal: 60000,
    tax: 6000,
    total: 66000,
  },
  {
    id: 'order2',
    tableId: 't4',
    tableNumber: 4,
    status: 'cancelled',
    cancelledFromStatus: 'preparing',
    cancelledAt: recentCancelledAt,
    cancelledByName: 'admin@distritowok.com',
    cancelledReason: 'Cliente se fue',
    items: [{ id: 'm1', name: 'Arroz Costeño Wok', price: 30000, quantity: 1 }],
    notes: '',
    subtotal: 30000,
    tax: 3000,
    total: 33000,
  },
];

const filterOrders = (status) => {
  if (!status) return mockOrders;
  if (Array.isArray(status)) return mockOrders.filter((o) => status.includes(o.status));
  return mockOrders.filter((o) => o.status === status);
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'u1', email: 'camarero@distritowok.com' },
    hasPermission: (p) => mockHasPermission(p),
    logout: mockLogout,
  }),
}));

jest.mock('../../hooks/useTables', () => ({
  useTables: () => ({
    tables: mockTables,
    loading: false,
    error: null,
    updateTableStatus: mockUpdateTableStatus,
  }),
}));

jest.mock('../../hooks/useOrders', () => ({
  ACTIVE_ORDER_STATUSES: ['pending', 'preparing', 'ready'],
  useOrders: (status) => ({
    orders: filterOrders(status),
    loading: false,
    error: null,
    createOrder: mockCreateOrder,
    updateOrderStatus: mockUpdateOrderStatus,
    updateOrder: mockUpdateOrder,
    cancelOrder: mockCancelOrder,
    reactivateOrder: mockReactivateOrder,
    processPayment: mockProcessPayment,
    transferOrder: mockTransferOrder,
  }),
}));

jest.mock('../../hooks/useCalls', () => ({
  useCalls: () => ({
    calls: mockPendingCalls,
    pendingCalls: mockPendingCalls,
    loading: false,
    error: null,
    resolveCall: mockResolveCall,
  }),
}));

jest.mock('../../hooks/useShift', () => ({
  useShift: () => ({
    shift: mockShift,
    loading: false,
    error: null,
    closeShift: mockCloseShift,
  }),
}));

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    menu: {
      arroces: [{ id: 'm1', name: 'Arroz Costeño Wok', price: '30K / 40K', available: true }],
      corrientes: [],
      porciones: [],
      bebidas: [],
    },
    loading: false,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaiterDashboard from './WaiterDashboard';

const ALL_PERMISSIONS = ['create_order', 'update_order_status', 'close_table', 'view_dashboard'];

afterEach(() => {
  mockOrders[0].status = 'pending';
});

beforeEach(() => {
  jest.clearAllMocks();
  mockHasPermission.mockImplementation((p) => ALL_PERMISSIONS.includes(p));
  mockUpdateTableStatus.mockImplementation(() => Promise.resolve({ success: true }));
  mockCreateOrder.mockImplementation(() => Promise.resolve({ success: true, id: 'newOrder' }));
  mockUpdateOrderStatus.mockImplementation(() => Promise.resolve({ success: true }));
  mockUpdateOrder.mockImplementation(() => Promise.resolve({ success: true }));
  mockCancelOrder.mockImplementation(() => Promise.resolve({ success: true }));
  mockReactivateOrder.mockImplementation(() => Promise.resolve({ success: true }));
  mockProcessPayment.mockImplementation(() => Promise.resolve({ success: true }));
  mockTransferOrder.mockImplementation(() =>
    Promise.resolve({ success: true, previousTableId: 't3' })
  );
  mockResolveCall.mockImplementation(() => Promise.resolve({ success: true }));
  mockCloseShift.mockImplementation(() => Promise.resolve({ success: true }));
  mockPendingCalls = [];
  mockShift = null;
  window.confirm = jest.fn(() => true);
  window.prompt = jest.fn(() => null);
  window.alert = jest.fn();
});

test('muestra mesas, pedidos activos y sus contadores', () => {
  render(<WaiterDashboard />);

  expect(screen.getByText('Mesa 1')).toBeInTheDocument();
  expect(screen.getByText('Mesa 2')).toBeInTheDocument();
  expect(screen.getByText('Mesa 3')).toBeInTheDocument();
  expect(screen.getByText('Pedidos (1)')).toBeInTheDocument();
  expect(screen.getByText(/Pedido activo — clic para ver/)).toBeInTheDocument();
});

test('abre el editor al hacer clic en una mesa ocupada con pedido activo', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Mesa 3'));

  expect(screen.getByText(/Editar Pedido/)).toBeInTheDocument();
});

test('libera la mesa ocupada sin pedido activo al cerrarla', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Cerrar mesa'));

  expect(window.confirm).toHaveBeenCalled();
  expect(mockUpdateTableStatus).toHaveBeenCalledWith('t2', 'available');
});

test('no muestra cerrar mesa sin permiso close_table', () => {
  mockHasPermission.mockImplementation((p) => p !== 'close_table');

  render(<WaiterDashboard />);

  expect(screen.queryByText('Cerrar mesa')).not.toBeInTheDocument();
});

test('no muestra la pestaña Nuevo Pedido sin permiso create_order', () => {
  mockHasPermission.mockImplementation((p) => p !== 'create_order');

  render(<WaiterDashboard />);

  expect(screen.queryByText('Nuevo Pedido')).not.toBeInTheDocument();
});

test('muestra acciones de estado en la pestaña Pedidos con permisos', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.getAllByText(/Arroz Costeño Wok/).length).toBeGreaterThan(0);
  expect(screen.getByText('Preparando')).toBeInTheDocument();
  expect(screen.getByText('✏️ Editar')).toBeInTheDocument();
  expect(screen.getByText('✕ Cancelar')).toBeInTheDocument();
});

test('cancela un pedido pendiente desde la tarjeta y libera la mesa', async () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('✕ Cancelar'));

  expect(window.confirm).toHaveBeenCalled();
  expect(window.prompt).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockCancelOrder).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({ userId: 'u1', reason: null })
    )
  );
  await waitFor(() =>
    expect(mockUpdateTableStatus).toHaveBeenCalledWith('t3', 'available')
  );
});

test('oculta acciones de estado sin permiso update_order_status', () => {
  mockHasPermission.mockImplementation(
    (p) => p !== 'update_order_status' && p !== 'create_order'
  );

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.getAllByText(/Arroz Costeño Wok/).length).toBeGreaterThan(0);
  expect(screen.queryByText('Preparando')).not.toBeInTheDocument();
  expect(screen.queryByText('✏️ Editar')).not.toBeInTheDocument();
  expect(screen.queryByText('✕ Cancelar')).not.toBeInTheDocument();
});

test('muestra los pedidos cancelados recientes con motivo y boton reactivar', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.getByText(/Cancelados recientes/)).toBeInTheDocument();
  expect(screen.getByText(/Estaba: Preparando/)).toBeInTheDocument();
  expect(screen.getByText(/Motivo: Cliente se fue/)).toBeInTheDocument();
  expect(screen.getByText('♻️ Reactivar')).toBeInTheDocument();
});

test('reactiva un pedido cancelado y vuelve a ocupar la mesa', async () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('♻️ Reactivar'));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() => expect(mockReactivateOrder).toHaveBeenCalledWith('order2'));
  await waitFor(() =>
    expect(mockUpdateTableStatus).toHaveBeenCalledWith('t4', 'occupied', 'order2')
  );
});

test('avisa de pedido duplicado y lo crea si el usuario confirma', async () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Mesa 1'));
  fireEvent.click(screen.getByRole('button', { name: /Pequeña/ }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  expect(window.confirm).toHaveBeenCalledWith(
    expect.stringContaining('Posible pedido duplicado')
  );
  await waitFor(() => expect(mockCreateOrder).toHaveBeenCalled());
  expect(mockCreateOrder).toHaveBeenCalledWith(
    expect.objectContaining({ waiterId: 'u1' })
  );
});

test('no crea el pedido si el usuario rechaza el aviso de duplicado', () => {
  window.confirm.mockReturnValue(false);

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Mesa 1'));
  fireEvent.click(screen.getByRole('button', { name: /Pequeña/ }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  expect(window.confirm).toHaveBeenCalledWith(
    expect.stringContaining('Posible pedido duplicado')
  );
  expect(mockCreateOrder).not.toHaveBeenCalled();
});

test('oculta los resúmenes sin permiso view_summaries', () => {
  render(<WaiterDashboard />);

  expect(screen.queryByText('Mesas disponibles')).not.toBeInTheDocument();
  expect(screen.queryByText('Pedidos activos')).not.toBeInTheDocument();
});

test('muestra los resúmenes con permiso view_summaries', () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'view_summaries'
  );

  render(<WaiterDashboard />);

  expect(screen.getByText('Mesas disponibles')).toBeInTheDocument();
  expect(screen.getByText('Mesas ocupadas')).toBeInTheDocument();
  expect(screen.getByText('Pedidos activos')).toBeInTheDocument();
  expect(screen.getByText('Pedidos listos')).toBeInTheDocument();
});

test('permite cobrar un pedido listo con charge_orders', async () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'charge_orders'
  );
  mockOrders[0].status = 'ready';

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('💵 Cobrar'));

  expect(screen.getByText('Cobrar Pedido')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Efectivo'));

  await waitFor(() =>
    expect(mockProcessPayment).toHaveBeenCalledWith(
      'order1',
      'cash',
      expect.objectContaining({ uid: 'u1' })
    )
  );
});

test('oculta el botón de cobrar sin permiso charge_orders', () => {
  mockOrders[0].status = 'ready';

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.queryByText('💵 Cobrar')).not.toBeInTheDocument();
});

test('filtra los pedidos por tipo', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.getByText(/Todos \(1\)/)).toBeInTheDocument();
  expect(screen.getByText(/Mesa \(1\)/)).toBeInTheDocument();
  expect(screen.getByText(/Domicilio \(0\)/)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/Domicilio \(0\)/));
  expect(screen.getByText('No hay pedidos de este tipo')).toBeInTheDocument();
});

test('no muestra la pestaña Historial sin permiso view_history', () => {
  render(<WaiterDashboard />);

  expect(screen.queryByText('Historial')).not.toBeInTheDocument();
});

test('muestra la pestaña Historial con permiso view_history', () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'view_history'
  );

  render(<WaiterDashboard />);

  expect(screen.getByText(/Historial/)).toBeInTheDocument();
});

test('no abre el editor de un pedido que ya está en cocina', () => {
  mockOrders[0].status = 'preparing';

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Mesa 3'));

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('ya está en cocina')
  );
  expect(screen.queryByText(/Editar Pedido/)).not.toBeInTheDocument();
});

test('permite cancelar un pedido listo con admin y motivo obligatorio', async () => {
  mockOrders[0].status = 'ready';
  window.prompt.mockReturnValue('Cliente se retiró sin pagar');

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('✕ Cancelar listo'));

  expect(window.confirm).toHaveBeenCalled();
  expect(window.prompt).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockCancelOrder).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({ reason: 'Cliente se retiró sin pagar' })
    )
  );
});

test('oculta el botón de cancelar listo sin permiso view_dashboard', () => {
  mockOrders[0].status = 'ready';
  mockHasPermission.mockImplementation((p) => p === 'update_order_status');

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.queryByText('✕ Cancelar listo')).not.toBeInTheDocument();
  expect(mockCancelOrder).not.toHaveBeenCalled();
});

test('traslada un pedido a otra mesa y sincroniza las mesas', async () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'transfer_order'
  );

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('🔀 Trasladar'));

  expect(screen.getByText('Trasladar Pedido')).toBeInTheDocument();
  expect(screen.queryByLabelText('Mesa destino 3')).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Mesa destino 1'));

  expect(window.confirm).toHaveBeenCalledWith(
    expect.stringContaining('a la mesa 1')
  );
  await waitFor(() =>
    expect(mockTransferOrder).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({ id: 't1', number: 1 })
    )
  );
  await waitFor(() =>
    expect(mockUpdateTableStatus).toHaveBeenCalledWith('t3', 'available')
  );
  await waitFor(() =>
    expect(mockUpdateTableStatus).toHaveBeenCalledWith('t1', 'occupied', 'order1')
  );
  expect(screen.queryByText('Trasladar Pedido')).not.toBeInTheDocument();
});

test('cancela el traslado si el usuario rechaza la confirmación', async () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'transfer_order'
  );
  window.confirm.mockReturnValue(false);

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));
  fireEvent.click(screen.getByText('🔀 Trasladar'));
  fireEvent.click(screen.getByLabelText('Mesa destino 1'));

  expect(mockTransferOrder).not.toHaveBeenCalled();
  expect(mockUpdateTableStatus).not.toHaveBeenCalled();
  expect(screen.getByText('Trasladar Pedido')).toBeInTheDocument();
});

test('oculta el botón de trasladar sin permiso transfer_order', () => {
  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText('Pedidos (1)'));

  expect(screen.queryByText('🔀 Trasladar')).not.toBeInTheDocument();
});

test('no muestra la pestaña Llamados sin permiso attend_calls', () => {
  render(<WaiterDashboard />);

  expect(screen.queryByText(/Llamados/)).not.toBeInTheDocument();
});

test('muestra los llamados pendientes y los marca como atendidos', async () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'attend_calls'
  );
  mockPendingCalls = [
    {
      id: 'c1',
      tableNumber: 5,
      message: 'La cuenta por favor',
      status: 'pending',
      createdAt: { toDate: () => new Date(Date.now() - 3 * 60000) },
    },
  ];

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText(/Llamados/));

  expect(screen.getByText('Mesa 5')).toBeInTheDocument();
  expect(screen.getByText(/La cuenta por favor/)).toBeInTheDocument();
  expect(screen.getByText(/hace 3 min/)).toBeInTheDocument();

  fireEvent.click(screen.getByText('✅ Atendido'));

  await waitFor(() =>
    expect(mockResolveCall).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ uid: 'u1' })
    )
  );
});

test('muestra estado vacío cuando no hay llamados', () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'attend_calls'
  );

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText(/Llamados/));

  expect(screen.getByText('No hay llamados pendientes')).toBeInTheDocument();
});

test('no muestra la pestaña Mi turno sin permiso close_shift', () => {
  render(<WaiterDashboard />);

  expect(screen.queryByText(/Mi turno/)).not.toBeInTheDocument();
});

test('muestra el resumen del turno y lo cierra con close_shift', async () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'close_shift'
  );

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText(/Mi turno/));

  expect(screen.getByText('Pedidos atendidos')).toBeInTheDocument();
  expect(screen.getByText('Total cobrado hoy')).toBeInTheDocument();
  expect(screen.getByText('Efectivo')).toBeInTheDocument();

  fireEvent.click(screen.getByText('🕒 Cerrar turno'));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockCloseShift).toHaveBeenCalledWith(
      expect.objectContaining({ orders: 0, total: 0 })
    )
  );
});

test('muestra el turno ya cerrado y bloquea cerrarlo de nuevo', () => {
  mockHasPermission.mockImplementation(
    (p) => ALL_PERMISSIONS.includes(p) || p === 'close_shift'
  );
  mockShift = {
    id: 'u1_2026-10-03',
    closedAt: { toDate: () => new Date() },
    summary: { orders: 4, total: 100000 },
  };

  render(<WaiterDashboard />);

  fireEvent.click(screen.getByText(/Mi turno/));

  expect(screen.getByText(/Turno cerrado a las/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Turno cerrado' })).toBeDisabled();
  expect(screen.getByText('4')).toBeInTheDocument();
});
