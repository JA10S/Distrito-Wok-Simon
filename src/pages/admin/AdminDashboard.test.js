const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockHasPermission = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'a1', email: 'admin@distritowok.com' },
    logout: mockLogout,
    hasPermission: (p) => mockHasPermission(p),
  }),
}));

jest.mock('../../hooks/useTables', () => ({
  useTables: () => ({ tables: [], updateTableStatus: jest.fn() }),
}));

jest.mock('../../hooks/useOrders', () => ({
  useOrders: () => ({ orders: [], loading: false, reactivateOrder: jest.fn() }),
}));

const mockAdminExpenses = [];

jest.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: mockAdminExpenses,
    loading: false,
    error: null,
    addExpense: jest.fn(),
    deleteExpense: jest.fn(),
  }),
}));

jest.mock('../../hooks/useDeliveries', () => ({
  useDeliveries: () => ({ deliveries: [] }),
}));

jest.mock('../../hooks/useDriverLocations', () => ({
  useDriverLocations: () => ({ drivers: [] }),
}));

let mockClosings = [
  {
    id: '2026-10-03',
    date: '2026-10-03',
    countedCash: 120000,
    difference: -5000,
    notes: 'Faltante en cambio',
    closedBy: 'cajero@distritowok.com',
    closedAt: null,
    summary: { totalSales: 500000, cashExpected: 125000 },
  },
];

const mockAdminCloseRegister = jest.fn();

jest.mock('../../hooks/useCashClosing', () => ({
  useCashClosings: () => ({ closings: mockClosings, loading: false, error: null }),
  useCashClosing: () => ({
    closing: null,
    loading: false,
    error: null,
    closeRegister: mockAdminCloseRegister,
  }),
  closingTime: () => '10:30 p. m.',
  dayKey: () => '2026-10-04',
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../../components/layout/DashboardHeader', () => {
  const react = require('react');
  return (props) =>
    react.createElement(
      'div',
      null,
      props.tabs.map((tab) =>
        react.createElement(
          'button',
          { key: tab.id, onClick: () => props.onTabChange(tab.id) },
          tab.label
        )
      )
    );
});

jest.mock('../../components/admin/MenuManager', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Gestión de Menú');
});

jest.mock('../../components/admin/RolesManager', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Gestión de Roles');
});

jest.mock('../../components/admin/UsersManager', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Gestión de Usuarios');
});

jest.mock('../../components/admin/ThemeManager', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Gestión de Apariencia');
});

jest.mock('../../components/admin/DriversMap', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Mapa de repartidores');
});

jest.mock('../../components/admin/InvoiceCreator', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Registro de Facturas');
});

jest.mock('../../components/admin/ExpenseManager', () => {
  const react = require('react');
  return () => react.createElement('div', null, 'Registro de Gastos');
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

beforeEach(() => {
  jest.clearAllMocks();
  mockHasPermission.mockImplementation(() => true);
  mockAdminCloseRegister.mockResolvedValue({ success: true });
  window.confirm = jest.fn(() => true);
  window.alert = jest.fn();
});

test('muestra la pestaña Repartidores con permiso track_drivers', () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Repartidores' }));

  expect(screen.getByText('Mapa de repartidores')).toBeInTheDocument();
});

test('no muestra la pestaña Repartidores sin permiso track_drivers', () => {
  mockHasPermission.mockImplementation(() => false);

  render(<AdminDashboard />);

  expect(screen.queryByRole('button', { name: 'Repartidores' })).not.toBeInTheDocument();
  expect(screen.queryByText('Mapa de repartidores')).not.toBeInTheDocument();
});

test('muestra las pestañas Facturas y Caja Menor', () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Facturas' }));
  expect(screen.getByText('Registro de Facturas')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Caja Menor' }));
  expect(screen.getByText('Registro de Gastos')).toBeInTheDocument();
});

test('muestra la pestaña Cierres con el historial de cierres de caja', () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByRole('button', { name: 'Cierres' }));

  expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
  expect(screen.getByText('2026-10-03')).toBeInTheDocument();
  expect(screen.getByText(/cajero@distritowok\.com/)).toBeInTheDocument();
  expect(screen.getByText(`Faltante $${(-5000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(/Faltante en cambio/)).toBeInTheDocument();
});

test('permite registrar el cierre de un día anterior sin cierre', async () => {
  render(<AdminDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cierres' }));

  expect(screen.getByText('Registrar cierre de un día')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Fecha del cierre/), {
    target: { value: '2026-10-02' },
  });
  fireEvent.change(screen.getByLabelText(/Efectivo contado/), {
    target: { value: '50000' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Cierre' }));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockAdminCloseRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-02',
        countedCash: 50000,
        summary: expect.objectContaining({
          totalSales: 0,
          cash: 0,
          cashExpected: 0,
          ordersCount: 0,
        }),
      })
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Cierre registrado');
});

test('precarga y permite actualizar el cierre existente al elegir su fecha', async () => {
  render(<AdminDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cierres' }));

  fireEvent.change(screen.getByLabelText(/Fecha del cierre/), {
    target: { value: '2026-10-03' },
  });

  expect(screen.getByText(/Ya existe un cierre para el 2026-10-03/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Efectivo contado/)).toHaveValue(120000);

  fireEvent.click(screen.getByRole('button', { name: 'Actualizar Cierre' }));

  await waitFor(() =>
    expect(mockAdminCloseRegister).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-10-03', countedCash: 120000 })
    )
  );
  expect(window.alert).toHaveBeenCalledWith('Cierre actualizado');
});

test('oculta el formulario de cierre sin permiso cash_register', () => {
  mockHasPermission.mockImplementation(() => false);

  render(<AdminDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Cierres' }));

  expect(screen.queryByText('Registrar cierre de un día')).not.toBeInTheDocument();
  expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
});
