const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    loading: false,
    error: null,
    menu: {
      arroces: [
        { id: 'a1', name: 'Arroz Costeño Wok', description: 'Cerdo, pollo y chorizo', price: '30K / 40K', available: true },
        { id: 'a2', name: 'Arroz Camarón Wok', description: 'Camarones frescos', price: '31K / 40K', available: false },
      ],
      corrientes: [],
      porciones: [],
      bebidas: [],
    },
  }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import MenuPage from './MenuPage';

test('renders available items and filters unavailable ones', () => {
  render(<MenuPage />);
  expect(screen.getByText(/Nuestros Arroces/)).toBeInTheDocument();
  expect(screen.getByText('Arroz Costeño Wok')).toBeInTheDocument();
  expect(screen.queryByText('Arroz Camarón Wok')).not.toBeInTheDocument();
});
