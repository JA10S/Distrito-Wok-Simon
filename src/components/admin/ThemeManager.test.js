const mockSaveCss = jest.fn(() => Promise.resolve({ success: true }));
const mockResetCss = jest.fn(() => Promise.resolve({ success: true }));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn()
}));

jest.mock('../../hooks/useCustomCss', () => ({
  useCustomCss: () => ({
    css: '.demo { color: red; }',
    loading: false,
    saveCss: (...args) => mockSaveCss(...args),
    resetCss: (...args) => mockResetCss(...args)
  }),
  MAX_CSS_LENGTH: 10000
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
  mockSaveCss.mockClear();
  mockSaveCss.mockImplementation(() => Promise.resolve({ success: true }));
  mockResetCss.mockClear();
  mockResetCss.mockImplementation(() => Promise.resolve({ success: true }));
  window.confirm = jest.fn(() => true);
});

test('muestra los campos de color y tipografía', () => {
  render(<ThemeManager />);

  expect(screen.getByText('Apariencia de las Páginas')).toBeInTheDocument();
  expect(screen.getByLabelText('Dorado (principal)')).toBeInTheDocument();
  expect(screen.getByLabelText('Fondo principal')).toBeInTheDocument();
  expect(screen.getByLabelText(/tarjetas destacadas/)).toBeInTheDocument();
  expect(screen.getByLabelText('Fondo de portada (menú)')).toBeInTheDocument();
  expect(screen.getByLabelText('Fondo de barra superior')).toBeInTheDocument();
  expect(screen.getByLabelText('Fondo del pie')).toBeInTheDocument();
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

test('permite cambiar de estilo (preset) con sus colores y tipografías', async () => {
  render(<ThemeManager />);

  fireEvent.click(screen.getByRole('button', { name: /Jade Oriental/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByText(/✓ Guardado/)).toBeInTheDocument();
  expect(saveTheme).toHaveBeenCalledWith(expect.objectContaining({
    preset: 'jade',
    headingFont: 'playfair',
    bodyFont: 'poppins',
    colors: expect.objectContaining({ surface: '#0A1311' })
  }));
});

test('permite cambiar el modo a diurno y guarda la paleta clara', async () => {
  render(<ThemeManager />);

  const lightButton = screen.getByText('Diurno').closest('button');
  expect(lightButton).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(lightButton);

  expect(screen.getByText('Diurno').closest('button')).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByText(/✓ Guardado/)).toBeInTheDocument();
  expect(saveTheme).toHaveBeenCalledWith(expect.objectContaining({
    mode: 'light',
    colors: expect.objectContaining({ surface: '#F2F0E9' })
  }));
});

test('permite cambiar la disposición del menú y las esquinas', async () => {
  render(<ThemeManager />);

  fireEvent.click(screen.getByRole('button', { name: /Hamburguesa/ }));
  fireEvent.click(screen.getByRole('button', { name: /Esquinas redondeadas/ }));

  expect(screen.getByRole('button', { name: /Hamburguesa/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Esquinas redondeadas/ })).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByText(/✓ Guardado/)).toBeInTheDocument();
  expect(saveTheme).toHaveBeenCalledWith(expect.objectContaining({
    layout: 'hamburger',
    radius: 'lg'
  }));
});

test('muestra las tres opciones de modo y disposición', () => {
  render(<ThemeManager />);

  expect(screen.getByText('Nocturno').closest('button')).toBeInTheDocument();
  expect(screen.getByText('Sistema').closest('button')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Clásica/ })).toBeInTheDocument();
  expect(screen.getByText('Menú lateral').closest('button')).toHaveAttribute('aria-pressed', 'false');
});

test('muestra el editor de CSS personalizado en la pestaña 🧩 CSS', () => {
  render(<ThemeManager />);

  fireEvent.click(screen.getByRole('button', { name: '🧩 CSS' }));

  expect(screen.getByText('CSS personalizado')).toBeInTheDocument();
  expect(screen.getByDisplayValue('.demo { color: red; }')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar CSS' })).toBeInTheDocument();
});
