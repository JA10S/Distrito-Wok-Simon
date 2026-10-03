const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    loading: false,
    error: null,
    menu: {
      arroces: [
        { id: 'a1', name: 'Arroz Costeño Wok', description: 'Cerdo, pollo y chorizo', price: '30K', available: true }
      ],
      corrientes: [],
      porciones: [],
      bebidas: []
    }
  })
}));

jest.mock('../../services/orderService', () => ({
  createTakeawayOrder: jest.fn(),
  watchOrder: jest.fn(() => () => {})
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MenuPage from './MenuPage';
import { useTheme } from '../../contexts/ThemeContext';

const setLayout = (layout) => {
  useTheme.mockReturnValue({
    theme: { layout },
    resolvedMode: 'dark',
    isLight: false,
    setLocalMode: jest.fn(),
    toggleMode: jest.fn()
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  setLayout('clasic');
});

test('disposición clásica: usa píldoras de categorías y sin hamburguesa', () => {
  render(<MenuPage />);

  expect(screen.queryByLabelText('Abrir menú')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /🍚 Arroces/ })).toBeInTheDocument();
  expect(screen.queryByLabelText('Menú de categorías')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Navegación lateral')).not.toBeInTheDocument();
});

test('disposición hamburguesa: abre el menú lateral con las categorías', () => {
  setLayout('hamburger');
  render(<MenuPage />);

  const drawer = screen.getByLabelText('Menú de categorías');
  expect(drawer.className).toContain('translate-x-full');
  expect(drawer.className).not.toContain('lg:hidden');

  fireEvent.click(screen.getByLabelText('Abrir menú'));
  expect(screen.getByLabelText('Menú de categorías').className).toContain('translate-x-0');
  expect(screen.getByRole('link', { name: /Arroces/ })).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Cerrar menú'));
  expect(screen.getByLabelText('Menú de categorías').className).toContain('translate-x-full');
});

test('disposición lateral: muestra la navegación lateral fija en escritorio', () => {
  setLayout('side');
  render(<MenuPage />);

  const sidebar = screen.getByLabelText('Navegación lateral');
  expect(sidebar.className).toContain('hidden lg:flex');
  expect(within(sidebar).getByRole('link', { name: /Arroces/ })).toBeInTheDocument();

  const bar = document.querySelector('header.sticky');
  expect(bar.className).toContain('lg:hidden');
  expect(screen.getByLabelText('Menú de categorías').className).toContain('lg:hidden');
});

test('el interruptor de modo está disponible en todas las disposiciones', () => {
  setLayout('hamburger');
  render(<MenuPage />);

  fireEvent.click(screen.getAllByLabelText('Cambiar a modo diurno')[0]);
  expect(useTheme().toggleMode).toHaveBeenCalledTimes(1);
});
