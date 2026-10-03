jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeToggle from './ModeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const toggleMode = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useTheme.mockReturnValue({ resolvedMode: 'dark', isLight: false, toggleMode });
});

test('en modo nocturno ofrece cambiar a diurno y dispara toggleMode', () => {
  render(<ModeToggle />);

  const button = screen.getByRole('button', { name: 'Cambiar a modo diurno' });
  expect(button).toHaveAttribute('title', 'Modo diurno');

  fireEvent.click(button);
  expect(toggleMode).toHaveBeenCalledTimes(1);
});

test('en modo diurno ofrece cambiar a nocturno', () => {
  useTheme.mockReturnValue({ resolvedMode: 'light', isLight: true, toggleMode });

  render(<ModeToggle />);

  const button = screen.getByRole('button', { name: 'Cambiar a modo nocturno' });
  expect(button).toHaveAttribute('title', 'Modo nocturno');
});

test('cambia la etiqueta cuando el modo cambia (re-render)', () => {
  useTheme.mockReturnValue({ resolvedMode: 'dark', isLight: false, toggleMode });
  const { rerender } = render(<ModeToggle />);

  expect(screen.getByRole('button', { name: 'Cambiar a modo diurno' })).toBeInTheDocument();

  useTheme.mockReturnValue({ resolvedMode: 'light', isLight: true, toggleMode });
  rerender(<ModeToggle />);

  expect(screen.getByRole('button', { name: 'Cambiar a modo nocturno' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cambiar a modo diurno' })).not.toBeInTheDocument();
});
