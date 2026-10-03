const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockOnUpdate = jest.fn();
const mockOnCancel = jest.fn();
const mockOnClose = jest.fn();

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    menu: {
      arroces: [{ id: 'a1', name: 'Arroz Costeño Wok', price: '30K / 40K', available: true }],
      corrientes: [],
      porciones: [],
      bebidas: [{ id: 'b1', name: 'Gaseosa', price: '5000', available: true }],
    },
    loading: false,
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderEditor from './OrderEditor';

const valueAfter = (label) => {
  const el = screen.getByText(label);
  return el.parentElement.textContent.slice(el.textContent.length);
};

const buildOrder = (overrides = {}) => ({
  id: 'orderXYZ123',
  type: 'table',
  tableNumber: 3,
  status: 'pending',
  items: [
    { id: 'a1--small', name: 'Arroz Costeño Wok (Pequeña)', price: 30000, quantity: 1, size: 'small' },
  ],
  notes: 'Sin cebolla',
  ...overrides,
});

const renderEditor = (order = buildOrder(), props = {}) =>
  render(
    <OrderEditor
      order={order}
      onUpdate={mockOnUpdate}
      onCancel={mockOnCancel}
      onClose={mockOnClose}
      canCancel
      {...props}
    />
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockOnUpdate.mockImplementation(() => ({ success: true }));
  window.alert = jest.fn();
});

test('muestra los items actuales, la mesa y los totales', () => {
  renderEditor();

  expect(screen.getByText(/Editar Pedido #XYZ123/)).toBeInTheDocument();
  expect(screen.getByText('Mesa 3')).toBeInTheDocument();
  expect(screen.getByText('Arroz Costeño Wok (Pequeña)')).toBeInTheDocument();
  expect(valueAfter('Subtotal:')).toBe(`$${(30000).toLocaleString()}`);
  expect(valueAfter('IVA (10%):')).toBe(`$${(3000).toLocaleString()}`);
  expect(valueAfter('Total:')).toBe(`$${(33000).toLocaleString()}`);
});

test('agrega un item desde el menú y actualiza los totales', () => {
  renderEditor();

  fireEvent.click(screen.getByRole('button', { name: /Bebidas/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar Gaseosa' }));

  expect(screen.getAllByText('Gaseosa').length).toBeGreaterThan(1);
  expect(valueAfter('Subtotal:')).toBe(`$${(35000).toLocaleString()}`);
  expect(valueAfter('IVA (10%):')).toBe(`$${(3500).toLocaleString()}`);
  expect(valueAfter('Total:')).toBe(`$${(38500).toLocaleString()}`);
});

test('guarda los cambios con los items y las notas editadas', () => {
  renderEditor();

  fireEvent.change(screen.getByPlaceholderText(/Sin cebolla, poco cocido/), {
    target: { value: 'Sin cebolla, poco cocido' },
  });
  fireEvent.click(screen.getByText('Guardar Cambios'));

  expect(mockOnUpdate).toHaveBeenCalledWith(
    'orderXYZ123',
    expect.objectContaining({
      notes: 'Sin cebolla, poco cocido',
      items: [expect.objectContaining({ id: 'a1--small', quantity: 1 })],
    })
  );
  expect(window.alert).not.toHaveBeenCalled();
});

test('bloquea la edición de pedidos que ya están en cocina', () => {
  renderEditor(buildOrder({ status: 'preparing' }));

  fireEvent.click(screen.getByText('Guardar Cambios'));

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Solo se pueden editar pedidos pendientes')
  );
  expect(mockOnUpdate).not.toHaveBeenCalled();
});

test('no permite guardar un pedido sin items', () => {
  renderEditor();

  fireEvent.click(screen.getAllByText('-')[0]);
  expect(screen.getByText('No hay items en el pedido')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Guardar Cambios'));

  expect(window.alert).toHaveBeenCalledWith(
    'El pedido debe tener al menos un item'
  );
  expect(mockOnUpdate).not.toHaveBeenCalled();
});

test('cancela el pedido desde el editor', () => {
  const order = buildOrder();
  renderEditor(order);

  fireEvent.click(screen.getByText('Cancelar Pedido'));

  expect(mockOnCancel).toHaveBeenCalledWith(order);
});

test('oculta el botón de cancelar con canCancel en false', () => {
  renderEditor(buildOrder(), { canCancel: false });

  expect(screen.queryByText('Cancelar Pedido')).not.toBeInTheDocument();
});

test('oculta el botón de cancelar para pedidos pagados', () => {
  renderEditor(buildOrder({ status: 'paid' }));

  expect(screen.queryByText('Cancelar Pedido')).not.toBeInTheDocument();
  expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
});

test('cierra el modal con el botón Cerrar y con la equis', () => {
  renderEditor();

  fireEvent.click(screen.getByText('Cerrar'));
  expect(mockOnClose).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: '✕' }));
  expect(mockOnClose).toHaveBeenCalledTimes(2);
});
