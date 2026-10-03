const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockHasPermission = jest.fn();
const mockLogout = jest.fn();
const mockProcessPayment = jest.fn();

let mockReadyOrders = [];
let mockPaidOrders = [];

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

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  mockHasPermission.mockImplementation(() => false);
  mockProcessPayment.mockImplementation(() => Promise.resolve({ success: true }));
  window.alert = jest.fn();
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
      expect.objectContaining({ uid: 'u1' })
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

test('muestra el cuadre de caja con los totales por método de pago', () => {
  render(<CashierDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cuadre de Caja' }));

  expect(screen.getByText('Resumen del Día')).toBeInTheDocument();
  expect(screen.getByText(`$${(153000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(`$${(66000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(`$${(43000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(`$${(44000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText(`$${Math.round(153000 / 4).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText('Cerrar Caja')).toBeInTheDocument();
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
