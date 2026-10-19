const mockLayout = { blocks: [] };
const mockSaveLayout = jest.fn(() => Promise.resolve({ success: true }));
const mockResetLayout = jest.fn(() => Promise.resolve({ success: true }));

jest.mock('../../hooks/useMenuLayout', () => ({
  useMenuLayout: () => ({
    layout: mockLayout,
    loading: false,
    saveLayout: (...args) => mockSaveLayout(...args),
    resetLayout: (...args) => mockResetLayout(...args)
  })
}));

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    loading: false,
    error: null,
    menu: {
      arroces: [
        { id: 'a1', name: 'Arroz Costeño', description: 'Wok', price: '26K', available: true }
      ],
      corrientes: [],
      porciones: [],
      bebidas: []
    }
  })
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: { layout: 'clasic' },
    resolvedMode: 'dark',
    isLight: false,
    setLocalMode: jest.fn(),
    toggleMode: jest.fn()
  })
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PageDesigner from './PageDesigner';

beforeEach(() => {
  mockLayout.blocks = [];
  mockSaveLayout.mockClear();
  mockResetLayout.mockClear();
  // resetMocks de CRA borra las implementaciones antes de cada test
  mockSaveLayout.mockImplementation(() => Promise.resolve({ success: true }));
  mockResetLayout.mockImplementation(() => Promise.resolve({ success: true }));
});

const rowOrder = () =>
  screen.queryAllByLabelText(/^Reordenar /).map((el) => el.getAttribute('aria-label'));

test('lista los bloques en el orden por defecto', () => {
  render(<PageDesigner />);

  expect(rowOrder()).toEqual([
    'Reordenar Portada',
    'Reordenar 🍚 Arroces',
    'Reordenar 🍖 Corrientes',
    'Reordenar 🍽️ Porciones',
    'Reordenar 🥤 Bebidas',
    'Reordenar Footer'
  ]);
});

test('la vista previa muestra el título editado en vivo', () => {
  render(<PageDesigner />);

  fireEvent.click(screen.getByLabelText('Editar textos: 🍚 Arroces'));
  fireEvent.change(screen.getByLabelText('🍚 Arroces: Título de la sección'), {
    target: { value: 'Arroces de la Casa' }
  });

  expect(
    screen.getByRole('heading', { name: /Arroces de la Casa/, level: 2 })
  ).toBeInTheDocument();
});

test('sube un bloque con el botón y cambia el orden', () => {
  render(<PageDesigner />);

  fireEvent.click(screen.getByLabelText('Bajar Portada'));

  expect(rowOrder()).toEqual([
    'Reordenar 🍚 Arroces',
    'Reordenar Portada',
    'Reordenar 🍖 Corrientes',
    'Reordenar 🍽️ Porciones',
    'Reordenar 🥤 Bebidas',
    'Reordenar Footer'
  ]);
});

test('la vista previa refleja el nuevo orden de las categorías', () => {
  render(<PageDesigner />);

  // 🍚 Arroces baja 4 posiciones → queda después de Bebidas (antes del Footer)
  fireEvent.click(screen.getByLabelText('Bajar 🍚 Arroces'));
  fireEvent.click(screen.getByLabelText('Bajar 🍚 Arroces'));
  fireEvent.click(screen.getByLabelText('Bajar 🍚 Arroces'));

  const titles = screen
    .queryAllByRole('heading', { level: 2 })
    .map((el) => el.textContent);

  expect(titles[0]).toBe('🍖 Corrientes');
  expect(titles[1]).toBe('🍽️ Porciones');
  expect(titles[2]).toBe('🥤 Bebidas');
  expect(titles[3]).toBe('🍚 Nuestros Arroces');
});

test('Guardar está deshabilitado sin cambios y guarda el orden al modificar', async () => {
  render(<PageDesigner />);

  const saveButton = screen.getByRole('button', { name: 'Guardar diseño' });
  expect(saveButton).toBeDisabled();

  fireEvent.click(screen.getByLabelText('Bajar Portada'));

  const activeSave = screen.getByRole('button', { name: 'Guardar diseño' });
  expect(activeSave).toBeEnabled();

  fireEvent.click(activeSave);

  expect(mockSaveLayout).toHaveBeenCalledTimes(1);
  const payload = mockSaveLayout.mock.calls[0][0];
  expect(payload.blocks.map((b) => b.id).slice(0, 2)).toEqual([
    'arroces',
    'hero'
  ]);
});

test('oculta un bloque con el interruptor y desaparece de la vista previa', () => {
  render(<PageDesigner />);

  expect(
    screen.getByRole('heading', { name: /Nuestros Arroces/, level: 2 })
  ).toBeInTheDocument();

  const toggle = screen.getByRole('switch', { name: 'Visible: 🍚 Arroces' });
  expect(toggle).toBeChecked();

  fireEvent.click(toggle);

  expect(toggle).not.toBeChecked();
  expect(
    screen.queryByRole('heading', { name: /Nuestros Arroces/, level: 2 })
  ).not.toBeInTheDocument();
});

test('restaurar por defecto pide confirmación y llama a resetLayout', () => {
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<PageDesigner />);

  fireEvent.click(screen.getByLabelText('Bajar Portada'));
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar por defecto' }));

  expect(confirmSpy).toHaveBeenCalled();
  expect(mockResetLayout).toHaveBeenCalledTimes(1);

  confirmSpy.mockRestore();
});

test('cambia entre vista de menú y login y entre dispositivos', () => {
  render(<PageDesigner />);

  expect(screen.getByLabelText('Vista previa del menú')).toHaveClass('w-[375px]');

  fireEvent.click(screen.getByRole('button', { name: '🖥️' }));
  expect(screen.getByLabelText('Vista previa del menú')).toHaveClass('w-full');

  fireEvent.click(screen.getByRole('button', { name: '🔐 Login' }));
  expect(screen.getByLabelText('Vista previa del login')).toBeInTheDocument();
});
