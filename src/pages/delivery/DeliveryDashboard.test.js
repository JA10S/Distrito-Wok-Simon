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

import React from 'react';
import { render, screen } from '@testing-library/react';
import DeliveryDashboard from './DeliveryDashboard';

test('renders available delivery orders', () => {
  render(<DeliveryDashboard />);
  expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  expect(screen.getByText(/Calle 45 #12-34/)).toBeInTheDocument();
  expect(screen.getByText(/Recoger Pedido/)).toBeInTheDocument();
});
