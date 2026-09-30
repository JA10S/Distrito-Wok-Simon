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
  fireEvent.click(screen.getAllByText('+')[0]);
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
  fireEvent.click(screen.getAllByText('+')[0]);
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
