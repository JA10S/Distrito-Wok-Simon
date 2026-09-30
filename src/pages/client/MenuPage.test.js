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

jest.mock('../../services/orderService', () => ({
  createTakeawayOrder: jest.fn(),
  watchOrder: jest.fn(() => () => {}),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuPage from './MenuPage';
import { createTakeawayOrder, watchOrder } from '../../services/orderService';

beforeEach(() => {
  createTakeawayOrder.mockResolvedValue({ success: true, id: 'o1', orderNumber: 'ABC123' });
  watchOrder.mockReturnValue(() => {});
});

test('renders available items and filters unavailable ones', () => {
  render(<MenuPage />);
  expect(screen.getByText(/Nuestros Arroces/)).toBeInTheDocument();
  expect(screen.getByText('Arroz Costeño Wok')).toBeInTheDocument();
  expect(screen.queryByText('Arroz Camarón Wok')).not.toBeInTheDocument();
});

test('agrega items al carrito y abre el checkout', () => {
  render(<MenuPage />);

  fireEvent.click(screen.getByText('＋ Agregar'));
  fireEvent.click(screen.getByText('＋ Agregar'));

  fireEvent.click(screen.getByRole('button', { name: /🛒/ }));
  expect(screen.getByText('Tu pedido')).toBeInTheDocument();
  expect(screen.getAllByText('Arroz Costeño Wok').length).toBeGreaterThan(1);
  expect(screen.getByRole('button', { name: /Confirmar pedido/ })).toBeInTheDocument();
});

test('valida datos del cliente antes de confirmar', () => {
  render(<MenuPage />);

  fireEvent.click(screen.getByText('＋ Agregar'));
  fireEvent.click(screen.getByRole('button', { name: /🛒/ }));
  fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));

  expect(screen.getByText(/Agrega al menos un plato|nombre del cliente/i)).toBeInTheDocument();
  expect(createTakeawayOrder).not.toHaveBeenCalled();
});

test('crea pedido para llevar y muestra confirmación', async () => {
  render(<MenuPage />);

  fireEvent.click(screen.getByText('＋ Agregar'));
  fireEvent.click(screen.getByRole('button', { name: /🛒/ }));

  fireEvent.change(screen.getByPlaceholderText('Tu nombre'), { target: { value: 'Juan Pérez' } });
  fireEvent.change(screen.getByPlaceholderText('300 123 4567'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByPlaceholderText('Calle, número, barrio'), { target: { value: 'Calle 45 #12-34' } });

  fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));

  expect(await screen.findByText('¡Pedido confirmado!')).toBeInTheDocument();
  expect(createTakeawayOrder).toHaveBeenCalledWith(expect.objectContaining({
    type: 'delivery',
    source: 'client',
    customer: expect.objectContaining({ name: 'Juan Pérez', phone: '3001234567' })
  }));
});
