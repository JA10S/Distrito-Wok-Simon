jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DashboardHeader from './DashboardHeader';
import { useTheme } from '../../contexts/ThemeContext';

const toggleMode = jest.fn();

const baseProps = {
  title: 'Panel de Prueba',
  user: 'admin@distritowok.com',
  onLogout: jest.fn(),
  activeTab: 'pedidos',
  onTabChange: jest.fn(),
  tabs: [
    { id: 'pedidos', label: 'Pedidos', icon: '🍜' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' }
  ]
};

const setLayout = (layout) => {
  useTheme.mockReturnValue({ theme: { layout }, isLight: false, toggleMode });
};

beforeEach(() => {
  jest.clearAllMocks();
  setLayout('clasic');
});

test('disposición clásica: muestra las pestañas y sin botón de menú', () => {
  render(<DashboardHeader {...baseProps} />);

  expect(screen.getByRole('button', { name: /Pedidos/ })).toBeInTheDocument();
  expect(screen.queryByLabelText('Abrir menú')).not.toBeInTheDocument();
});

test('disposición hamburguesa: oculta la barra y abre las pestañas en el menú lateral', () => {
  setLayout('hamburger');
  render(<DashboardHeader {...baseProps} />);

  const bar = document.querySelector('nav');
  expect(bar.className).toContain('hidden');
  expect(bar.className).not.toContain('lg:block');

  fireEvent.click(screen.getByLabelText('Abrir menú'));
  const drawer = screen.getByLabelText('Menú de secciones');
  expect(drawer.className).toContain('translate-x-0');
  expect(drawer.className).not.toContain('lg:hidden');

  fireEvent.click(within(drawer).getByRole('button', { name: /Usuarios/ }));
  expect(baseProps.onTabChange).toHaveBeenCalledWith('usuarios');
  expect(screen.getByLabelText('Menú de secciones').className).toContain('translate-x-full');
});

test('disposición lateral: la barra es visible en escritorio y el menú solo en móvil', () => {
  setLayout('side');
  render(<DashboardHeader {...baseProps} />);

  const bar = document.querySelector('nav');
  expect(bar.className).toContain('hidden lg:block');

  expect(screen.getByLabelText('Abrir menú').className).toContain('lg:hidden');
  expect(screen.getByLabelText('Menú de secciones').className).toContain('lg:hidden');
});

test('botón de modo nocturno/diurno invoca toggleMode', () => {
  render(<DashboardHeader {...baseProps} />);

  fireEvent.click(screen.getByLabelText('Cambiar a modo diurno'));
  expect(toggleMode).toHaveBeenCalledTimes(1);
});
