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
  useOrders: () => ({ orders: [], reactivateOrder: jest.fn() }),
}));

jest.mock('../../hooks/useDeliveries', () => ({
  useDeliveries: () => ({ deliveries: [] }),
}));

jest.mock('../../hooks/useDriverLocations', () => ({
  useDriverLocations: () => ({ drivers: [] }),
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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

beforeEach(() => {
  jest.clearAllMocks();
  mockHasPermission.mockImplementation(() => true);
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
