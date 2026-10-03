const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockOnConfirmOrder = jest.fn();
const mockOnTableSelect = jest.fn();

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    menu: {
      arroces: [
        { id: 'a1', name: 'Arroz Costeño Wok', price: '30K / 40K', available: true },
        { id: 'a2', name: 'Arroz No Disponible', price: '26K', available: false },
      ],
      corrientes: [],
      porciones: [],
      bebidas: [{ id: 'b1', name: 'Gaseosa', price: '5000', available: true }],
    },
    loading: false,
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import OrderCreator from './OrderCreator';

const tables = [
  { id: 't1', number: 1, capacity: 4, status: 'available' },
  { id: 't2', number: 2, capacity: 2, status: 'occupied' },
];

const summaryPanel = () => screen.getByText('Resumen del Pedido').closest('div.sticky');

const valueAfter = (label) => {
  const el = screen.getByText(label);
  return el.parentElement.textContent.slice(el.textContent.length);
};

const renderCreator = (props = {}) =>
  render(
    <OrderCreator
      tables={tables}
      selectedTable={null}
      onTableSelect={mockOnTableSelect}
      onConfirmOrder={mockOnConfirmOrder}
      {...props}
    />
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockOnConfirmOrder.mockImplementation(() => Promise.resolve({ success: true }));
  window.alert = jest.fn();
});

test('oculta del menú los items que no están disponibles', () => {
  renderCreator();

  expect(screen.getByText('Arroz Costeño Wok')).toBeInTheDocument();
  expect(screen.queryByText('Arroz No Disponible')).not.toBeInTheDocument();
});

test('agrega un item con tamaño y calcula subtotal, IVA y total', () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));

  expect(screen.getByText('Arroz Costeño Wok (Grande)')).toBeInTheDocument();
  expect(valueAfter('Subtotal:')).toBe(`$${(40000).toLocaleString()}`);
  expect(valueAfter('IVA (10%):')).toBe(`$${(4000).toLocaleString()}`);
  expect(valueAfter('Total:')).toBe(`$${(44000).toLocaleString()}`);
});

test('incrementa y decrementa la cantidad de un item del resumen', () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));
  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));
  expect(valueAfter('Subtotal:')).toBe(`$${(80000).toLocaleString()}`);

  fireEvent.click(within(summaryPanel()).getByText('-'));
  expect(valueAfter('Subtotal:')).toBe(`$${(40000).toLocaleString()}`);
  expect(valueAfter('Total:')).toBe(`$${(44000).toLocaleString()}`);
});

test('no permite crear el pedido en mesa sin mesa seleccionada', () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));

  expect(screen.getByText('Sin mesa seleccionada')).toBeInTheDocument();
  expect(screen.getByText('Crear Pedido')).toBeDisabled();
});

test('selecciona una mesa disponible al hacer clic', () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: /4 pers\./ }));

  expect(mockOnTableSelect).toHaveBeenCalledWith(tables[0]);
});

test('crea el pedido en mesa con items, notas y totales', async () => {
  renderCreator({ selectedTable: tables[0] });

  fireEvent.click(screen.getByRole('button', { name: 'Pequeña Arroz Costeño Wok' }));
  fireEvent.change(screen.getByPlaceholderText(/Sin cebolla/), {
    target: { value: 'Poco cocido' },
  });
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() => expect(mockOnConfirmOrder).toHaveBeenCalledTimes(1));
  expect(mockOnConfirmOrder).toHaveBeenCalledWith({
    items: [expect.objectContaining({ id: 'a1--small', size: 'small', price: 30000, quantity: 1 })],
    notes: 'Poco cocido',
    subtotal: 30000,
    tax: 3000,
    total: 33000,
    type: 'table',
    tableId: 't1',
    tableNumber: 1,
  });
});

test('valida los datos del cliente al crear un pedido para llevar', async () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: '🥡 Para llevar' }));
  fireEvent.click(screen.getByRole('button', { name: /Pequeña/ }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese el nombre del cliente')
  );
  expect(mockOnConfirmOrder).not.toHaveBeenCalled();

  fireEvent.change(screen.getByPlaceholderText('Ej: Juan Pérez'), {
    target: { value: 'Ana' },
  });
  fireEvent.click(screen.getByText('Crear Pedido'));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      'Ingrese un teléfono válido (mínimo 7 dígitos)'
    )
  );

  fireEvent.change(screen.getByPlaceholderText('Ej: 300 123 4567'), {
    target: { value: '3001234567' },
  });
  fireEvent.click(screen.getByText('Crear Pedido'));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese la dirección de entrega')
  );
  expect(mockOnConfirmOrder).not.toHaveBeenCalled();
});

test('crea un pedido de domicilio con los datos del cliente', async () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: '🥡 Para llevar' }));
  fireEvent.change(screen.getByPlaceholderText('Ej: Juan Pérez'), {
    target: { value: 'Ana Torres' },
  });
  fireEvent.change(screen.getByPlaceholderText('Ej: 300 123 4567'), {
    target: { value: '300 123 4567' },
  });
  fireEvent.change(screen.getByPlaceholderText(/Calle 45 #12-34/), {
    target: { value: 'Calle 10 #20-30' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Pequeña/ }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() => expect(mockOnConfirmOrder).toHaveBeenCalledTimes(1));
  expect(mockOnConfirmOrder).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'delivery',
      tableId: null,
      tableNumber: 0,
      preferredPayment: 'cash',
      source: 'waiter',
      customer: expect.objectContaining({
        name: 'Ana Torres',
        phone: '300 123 4567',
        address: 'Calle 10 #20-30',
      }),
      total: 33000,
    })
  );
});

test('permite recoger en local sin dirección de entrega', async () => {
  renderCreator();

  fireEvent.click(screen.getByRole('button', { name: '🥡 Para llevar' }));
  fireEvent.click(screen.getByRole('button', { name: '🥡 Recoger en local' }));
  fireEvent.change(screen.getByPlaceholderText('Ej: Juan Pérez'), {
    target: { value: 'Carlos' },
  });
  fireEvent.change(screen.getByPlaceholderText('Ej: 300 123 4567'), {
    target: { value: '3001234567' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Pequeña/ }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() => expect(mockOnConfirmOrder).toHaveBeenCalledTimes(1));
  expect(mockOnConfirmOrder).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'pickup' })
  );
});

test('no limpia el carrito si la creación del pedido falla', async () => {
  mockOnConfirmOrder.mockImplementation(() =>
    Promise.resolve({ success: false, error: 'Sin permisos' })
  );

  renderCreator({ selectedTable: tables[0] });

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() => expect(mockOnConfirmOrder).toHaveBeenCalledTimes(1));
  expect(screen.getByText('Arroz Costeño Wok (Grande)')).toBeInTheDocument();
  expect(screen.queryByText('Agregue items del menú')).not.toBeInTheDocument();
});

test('limpia el carrito tras una creación exitosa', async () => {
  renderCreator({ selectedTable: tables[0] });

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Costeño Wok' }));
  fireEvent.click(screen.getByText('Crear Pedido'));

  await waitFor(() => expect(mockOnConfirmOrder).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.getByText('Agregue items del menú')).toBeInTheDocument()
  );
  expect(screen.getByText('Mesa:').parentElement).toHaveTextContent('1');
});

test('busca platos en todas las categorías', () => {
  renderCreator();

  fireEvent.change(screen.getByLabelText('Buscar plato'), {
    target: { value: 'gaseosa' },
  });

  expect(screen.getByText('Gaseosa')).toBeInTheDocument();
  expect(screen.queryByText('Arroz Costeño Wok')).not.toBeInTheDocument();
  expect(screen.getByText(/1 resultado para/)).toBeInTheDocument();
  expect(screen.queryByText('Arroces')).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Limpiar búsqueda'));
  expect(screen.getByText('Arroz Costeño Wok')).toBeInTheDocument();
  expect(screen.getByText('Arroces')).toBeInTheDocument();
});

test('muestra mensaje cuando la búsqueda no tiene resultados', () => {
  renderCreator();

  fireEvent.change(screen.getByLabelText('Buscar plato'), {
    target: { value: 'pizza' },
  });

  expect(screen.getByText(/No se encontraron platos/)).toBeInTheDocument();
  expect(screen.queryByText('Arroz Costeño Wok')).not.toBeInTheDocument();
});

test('agrega un plato desde la sección de más pedidos hoy', () => {
  renderCreator({
    topItems: [{ id: 'a1', name: 'Arroz Costeño Wok', count: 7 }],
  });

  expect(screen.getByText(/Más pedidos hoy/)).toBeInTheDocument();
  expect(screen.getByText('×7')).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Agregar Arroz Costeño Wok'));

  expect(screen.getByText('Arroz Costeño Wok (Pequeña)')).toBeInTheDocument();
  expect(valueAfter('Subtotal:')).toBe(`$${(30000).toLocaleString()}`);
});

test('oculta los más pedidos mientras se usa el buscador', () => {
  renderCreator({
    topItems: [{ id: 'a1', name: 'Arroz Costeño Wok', count: 7 }],
  });

  expect(screen.getByText(/Más pedidos hoy/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Buscar plato'), {
    target: { value: 'gaseosa' },
  });

  expect(screen.queryByText(/Más pedidos hoy/)).not.toBeInTheDocument();
});
