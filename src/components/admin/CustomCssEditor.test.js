const mockSaveCss = jest.fn(() => Promise.resolve({ success: true }));
const mockResetCss = jest.fn(() => Promise.resolve({ success: true }));

let mockCss = '';
let mockLoading = false;

jest.mock('../../hooks/useCustomCss', () => ({
  useCustomCss: () => ({
    css: mockCss,
    loading: mockLoading,
    saveCss: (...args) => mockSaveCss(...args),
    resetCss: (...args) => mockResetCss(...args)
  }),
  MAX_CSS_LENGTH: 10000
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomCssEditor from './CustomCssEditor';

beforeEach(() => {
  mockCss = '';
  mockLoading = false;
  mockSaveCss.mockClear();
  mockSaveCss.mockImplementation(() => Promise.resolve({ success: true }));
  mockResetCss.mockClear();
  mockResetCss.mockImplementation(() => Promise.resolve({ success: true }));
  window.confirm = jest.fn(() => true);
});

test('muestra el CSS cargado, el contador y Guardar deshabilitado sin cambios', () => {
  mockCss = '.demo { color: red; }';

  render(<CustomCssEditor />);

  expect(screen.getByDisplayValue('.demo { color: red; }')).toBeInTheDocument();
  expect(screen.getByText(/\/ .* caracteres/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar CSS' })).toBeDisabled();
});

test('guardar llama a saveCss con el texto editado y confirma el guardado', async () => {
  render(<CustomCssEditor />);

  const textarea = screen.getByPlaceholderText(/Ejemplo/);
  fireEvent.change(textarea, { target: { value: '.btn-gold { border-radius: 9999px; }' } });

  const saveButton = screen.getByRole('button', { name: 'Guardar CSS' });
  expect(saveButton).toBeEnabled();
  fireEvent.click(saveButton);

  expect(mockSaveCss).toHaveBeenCalledWith('.btn-gold { border-radius: 9999px; }');
  expect(await screen.findByText(/✓ CSS guardado/)).toBeInTheDocument();
});

test('muestra error de guardado cuando saveCss falla', async () => {
  mockSaveCss.mockImplementation(() => Promise.resolve({ success: false, error: 'denied' }));

  render(<CustomCssEditor />);

  fireEvent.change(screen.getByPlaceholderText(/Ejemplo/), {
    target: { value: 'h1 { color: blue; }' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar CSS' }));

  expect(await screen.findByText(/No se pudo guardar/)).toBeInTheDocument();
});

test('el botón Copiar de un ejemplo agrega el código al textarea', () => {
  render(<CustomCssEditor />);

  fireEvent.click(screen.getAllByRole('button', { name: 'Copiar' })[0]);

  expect(
    screen.getByDisplayValue('.btn-gold { border-radius: 9999px; }')
  ).toBeInTheDocument();
});

test('Quitar CSS pide confirmación y llama a resetCss', async () => {
  mockCss = '.demo { color: red; }';

  render(<CustomCssEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Quitar CSS' }));

  expect(window.confirm).toHaveBeenCalled();
  expect(mockResetCss).toHaveBeenCalledTimes(1);
  expect(await screen.findByText(/✓ CSS eliminado/)).toBeInTheDocument();
});

test('Quitar CSS está deshabilitado cuando no hay CSS guardado', () => {
  render(<CustomCssEditor />);

  expect(screen.getByRole('button', { name: 'Quitar CSS' })).toBeDisabled();
});
