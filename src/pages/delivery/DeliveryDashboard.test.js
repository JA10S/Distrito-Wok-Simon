const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'u1', email: 'domicilio@distritowok.com' },
    hasPermission: () => false,
    logout: jest.fn(),
  }),
}));

jest.mock('../../hooks/useDeliveries', () => ({
  useDeliveries: () => ({
    deliveries: [
      {
        id: 'd1',
        customer: 'Juan Pérez',
        address: 'Calle 45 #12-34',
        phone: '+573001234567',
        items: [{ name: 'Arroz Oriental Wok', quantity: 1, price: 47000 }],
        total: 47000,
        status: 'ready',
        notes: '',
      },
    ],
    loading: false,
    error: null,
    takeDelivery: jest.fn(() => Promise.resolve({ success: true })),
    markDelivered: jest.fn(() => Promise.resolve({ success: true })),
    cancelDelivery: jest.fn(),
    createDelivery: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const mockStartSharing = jest.fn();
const mockStopSharing = jest.fn();
let mockSharing = false;
let mockPosition = null;
let mockLocationError = '';

jest.mock('../../hooks/useDriverLocation', () => ({
  useDriverLocation: () => ({
    supported: true,
    sharing: mockSharing,
    position: mockPosition,
    error: mockLocationError,
    startSharing: mockStartSharing,
    stopSharing: mockStopSharing,
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeliveryDashboard from './DeliveryDashboard';

beforeEach(() => {
  jest.clearAllMocks();
  mockSharing = false;
  mockPosition = null;
  mockLocationError = '';
});

test('renders available delivery orders', () => {
  render(<DeliveryDashboard />);
  expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  expect(screen.getByText(/Calle 45 #12-34/)).toBeInTheDocument();
  expect(screen.getByText(/Recoger Pedido/)).toBeInTheDocument();
});

test('permite compartir la ubicación con el administrador', () => {
  render(<DeliveryDashboard />);

  expect(screen.getByText(/Apagado · el administrador no ve mi posición/)).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: 'Compartir ubicación' })).toHaveAttribute(
    'aria-checked',
    'false'
  );

  fireEvent.click(screen.getByRole('switch', { name: 'Compartir ubicación' }));

  expect(mockStartSharing).toHaveBeenCalledTimes(1);
  expect(mockStopSharing).not.toHaveBeenCalled();
});

test('muestra la posición activa y el botón de detener', () => {
  mockSharing = true;
  mockPosition = { lat: 4.6, lng: -74.1, accuracy: 12.4, at: Date.now() };

  render(<DeliveryDashboard />);

  expect(screen.getByText(/Activo · precisión ±12 m/)).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: 'Compartir ubicación' })).toHaveAttribute(
    'aria-checked',
    'true'
  );

  fireEvent.click(screen.getByRole('switch', { name: 'Compartir ubicación' }));

  expect(mockStopSharing).toHaveBeenCalledTimes(1);
  expect(mockStartSharing).not.toHaveBeenCalled();
});

test('muestra el error cuando el navegador deniega la ubicación', () => {
  mockLocationError = 'Permiso de ubicación denegado. Actívalo en los ajustes del navegador.';

  render(<DeliveryDashboard />);

  expect(screen.getByRole('alert')).toHaveTextContent(/Permiso de ubicación denegado/);
});
