jest.mock('../../hooks/useMenuAdmin', () => ({
  useMenuAdmin: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MenuManager from './MenuManager';
import { useMenuAdmin } from '../../hooks/useMenuAdmin';

const addItem = jest.fn();
const updateItem = jest.fn();
const deleteItem = jest.fn();

const menuItems = {
  arroces: [
    { id: 'a1', name: 'Arroz chaufa', price: '26K', description: 'Con pollo', available: true }
  ],
  corrientes: [],
  porciones: [],
  bebidas: []
};

beforeEach(() => {
  addItem.mockResolvedValue({ success: true });
  updateItem.mockResolvedValue({ success: true });
  deleteItem.mockResolvedValue({ success: true });
  useMenuAdmin.mockReturnValue({
    menuItems,
    loading: false,
    addItem,
    updateItem,
    deleteItem
  });
});

test('abre el formulario en un modal al pulsar Nuevo Producto', () => {
  render(<MenuManager />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '+ Nuevo Producto' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Nombre del producto')).toHaveFocus();
});

test('abre el modal de edición con los datos del producto', () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Editar Producto')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Nombre del producto')).toHaveValue('Arroz chaufa');
  expect(screen.getByPlaceholderText('Ej: 26K / 35K')).toHaveValue('26K');
});

test('cierra el modal con la equis y con Escape', () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '+ Nuevo Producto' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '+ Nuevo Producto' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('actualiza el producto desde el modal y lo cierra', async () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByPlaceholderText('Ej: 26K / 35K'), {
    target: { value: '28K' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

  await waitFor(() => {
    expect(updateItem).toHaveBeenCalledWith(
      'arroces',
      'a1',
      expect.objectContaining({ price: '28K', name: 'Arroz chaufa' })
    );
  });
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('crea un producto nuevo desde el modal', async () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '+ Nuevo Producto' }));
  fireEvent.change(screen.getByPlaceholderText('Nombre del producto'), {
    target: { value: 'Arroz frito' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

  await waitFor(() => {
    expect(addItem).toHaveBeenCalledWith(
      'arroces',
      expect.objectContaining({ name: 'Arroz frito' })
    );
  });
});

test('muestra error si falta el nombre', () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '+ Nuevo Producto' }));
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

  expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
  expect(addItem).not.toHaveBeenCalled();
});

test('el buscador filtra en todas las categorías y oculta las pestañas', () => {
  useMenuAdmin.mockReturnValue({
    menuItems: {
      arroces: [
        { id: 'a1', name: 'Arroz chaufa', price: '26K', available: true }
      ],
      corrientes: [],
      porciones: [],
      bebidas: [
        { id: 'b1', name: 'Coca Cola', price: '5K', available: true },
        { id: 'b2', name: 'Jugo de mango', description: 'Natural', price: '6K', available: true }
      ]
    },
    loading: false,
    addItem,
    updateItem,
    deleteItem
  });

  render(<MenuManager />);

  fireEvent.change(screen.getByLabelText('Buscar productos'), {
    target: { value: 'coca' }
  });

  expect(screen.getByText('Coca Cola')).toBeInTheDocument();
  expect(screen.getByText('🥤 Bebidas')).toBeInTheDocument();
  expect(screen.queryByText('Jugo de mango')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Arroces/ })).not.toBeInTheDocument();
});

test('el buscador muestra estado vacío si no hay coincidencias', () => {
  render(<MenuManager />);

  fireEvent.change(screen.getByLabelText('Buscar productos'), {
    target: { value: 'xyz' }
  });

  expect(screen.getByText('No se encontraron productos para "xyz"')).toBeInTheDocument();
});

test('guarda un precio nuevo desde la vista Precios', async () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '💲 Precios' }));

  fireEvent.change(screen.getByLabelText('Nuevo precio de Arroz chaufa'), {
    target: { value: '30K' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

  await waitFor(() => {
    expect(updateItem).toHaveBeenCalledWith('arroces', 'a1', { price: '30K' });
  });
});

test('el botón Guardar de precios está deshabilitado si el precio no cambió', () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '💲 Precios' }));

  const saveButton = screen.getByRole('button', { name: 'Guardar' });
  expect(saveButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText('Nuevo precio de Arroz chaufa'), {
    target: { value: '28K' }
  });
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
});

test('el toggle de disponibilidad marca un producto como no disponible', async () => {
  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '✅ Disponibilidad' }));

  fireEvent.click(screen.getByRole('switch', { name: 'Disponible: Arroz chaufa' }));

  await waitFor(() => {
    expect(updateItem).toHaveBeenCalledWith('arroces', 'a1', { available: false });
  });
});

test('el toggle de disponibilidad reactiva un producto agotado', async () => {
  useMenuAdmin.mockReturnValue({
    menuItems: {
      arroces: [
        { id: 'a1', name: 'Arroz chaufa', price: '26K', available: false }
      ],
      corrientes: [],
      porciones: [],
      bebidas: []
    },
    loading: false,
    addItem,
    updateItem,
    deleteItem
  });

  render(<MenuManager />);

  fireEvent.click(screen.getByRole('button', { name: '✅ Disponibilidad' }));

  const toggle = screen.getByRole('switch', { name: 'Disponible: Arroz chaufa' });
  expect(toggle).not.toBeChecked();

  fireEvent.click(toggle);

  await waitFor(() => {
    expect(updateItem).toHaveBeenCalledWith('arroces', 'a1', { available: true });
  });
});
