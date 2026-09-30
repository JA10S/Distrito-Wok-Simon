jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeManager from './ThemeManager';
import { useTheme } from '../../contexts/ThemeContext';
import { DEFAULT_THEME } from '../../utils/themeUtils';

const saveTheme = jest.fn();
const resetTheme = jest.fn();

beforeEach(() => {
  saveTheme.mockResolvedValue({ success: true });
  resetTheme.mockResolvedValue({ success: true });
  useTheme.mockReturnValue({
    theme: DEFAULT_THEME,
    saveTheme,
    resetTheme
  });
  window.confirm = jest.fn(() => true);
});

test('muestra los campos de color y tipografía', () => {
  render(<ThemeManager />);

  expect(screen.getByText('Apariencia de las Páginas')).toBeInTheDocument();
  expect(screen.getByLabelText('Dorado (principal)')).toBeInTheDocument();
  expect(screen.getByLabelText('Fondo principal')).toBeInTheDocument();
  expect(screen.getByLabelText('Títulos y encabezados')).toBeInTheDocument();
  expect(screen.getByLabelText('Texto del cuerpo')).toBeInTheDocument();
});

test('guarda un color cambiado', async () => {
  render(<ThemeManager />);

  fireEvent.change(screen.getByLabelText('Dorado (principal)'), {
    target: { value: '#123456' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByText(/✓ Guardado/)).toBeInTheDocument();
  expect(saveTheme).toHaveBeenCalledWith(expect.objectContaining({
    colors: expect.objectContaining({ dorado: '#123456' })
  }));
});

test('guarda la tipografía de títulos cambiada', async () => {
  render(<ThemeManager />);

  fireEvent.change(screen.getByLabelText('Títulos y encabezados'), {
    target: { value: 'playfair' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByText(/✓ Guardado/)).toBeInTheDocument();
  expect(saveTheme).toHaveBeenCalledWith(expect.objectContaining({
    headingFont: 'playfair'
  }));
});

test('restaura valores por defecto tras confirmar', async () => {
  render(<ThemeManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Restaurar por defecto' }));

  expect(window.confirm).toHaveBeenCalled();
  expect(await screen.findByText(/✓ Valores originales restaurados/)).toBeInTheDocument();
  expect(resetTheme).toHaveBeenCalled();
});
