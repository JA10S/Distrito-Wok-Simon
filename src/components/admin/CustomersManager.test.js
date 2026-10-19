const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockAddCustomer = jest.fn();
const mockUpdateCustomer = jest.fn();
const mockDeleteCustomer = jest.fn();
const mockRegisterCredit = jest.fn();
let mockCustomers = [];
let mockTransactions = [];
let mockLoading = false;
let mockTotalCredit = 0;

jest.mock('../../hooks/useCredit', () => ({
  CREDIT_TX_LABELS: { fiado: 'Fiado', abono: 'Abono', cobro: 'Cobro total' },
  useCredit: () => ({
    customers: mockCustomers,
    transactions: mockTransactions,
    loading: mockLoading,
    totalCredit: mockTotalCredit,
    addCustomer: mockAddCustomer,
    updateCustomer: mockUpdateCustomer,
    deleteCustomer: mockDeleteCustomer,
    registerCredit: mockRegisterCredit,
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CustomersManager from './CustomersManager';

const user = { uid: 'a1', email: 'admin@distritowok.com' };

beforeEach(() => {
  jest.clearAllMocks();
  mockCustomers = [];
  mockTransactions = [];
  mockLoading = false;
  mockTotalCredit = 0;
  mockAddCustomer.mockImplementation(() => Promise.resolve({ success: true, id: 'c1' }));
  mockUpdateCustomer.mockImplementation(() => Promise.resolve({ success: true }));
  mockDeleteCustomer.mockImplementation(() => Promise.resolve({ success: true }));
  mockRegisterCredit.mockImplementation(() => Promise.resolve({ success: true, newBalance: 0 }));
  window.confirm = jest.fn(() => true);
});

test('muestra estado vacío y saldo total en cero', () => {
  render(<CustomersManager user={user} />);

  expect(screen.getByText('Cartera de Clientes (Fiado)')).toBeInTheDocument();
  expect(screen.getByText(/Saldo total pendiente/)).toBeInTheDocument();
  expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument();
});

test('crea un cliente con nombre y teléfono', async () => {
  render(<CustomersManager user={user} />);

  fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'María Pérez' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '3001234567' } });
  fireEvent.click(screen.getByRole('button', { name: /Crear/ }));

  await waitFor(() => expect(mockAddCustomer).toHaveBeenCalledTimes(1));
  expect(mockAddCustomer).toHaveBeenCalledWith({
    name: 'María Pérez',
    phone: '3001234567',
    notes: '',
  });
  expect(await screen.findByText('✓ Cliente creado')).toBeInTheDocument();
});

test('no permite crear cliente sin nombre', () => {
  render(<CustomersManager user={user} />);

  expect(screen.getByRole('button', { name: /Crear/ })).toBeDisabled();
});

test('filtra clientes por nombre', () => {
  mockCustomers = [
    { id: 'c1', name: 'María Pérez', phone: '300', balance: 0 },
    { id: 'c2', name: 'Juan Gómez', phone: '301', balance: 0 },
  ];

  render(<CustomersManager user={user} />);

  expect(screen.getByText('María Pérez')).toBeInTheDocument();
  expect(screen.getByText('Juan Gómez')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText(/Buscar cliente/), {
    target: { value: 'juan' },
  });

  expect(screen.getByText('Juan Gómez')).toBeInTheDocument();
  expect(screen.queryByText('María Pérez')).not.toBeInTheDocument();
});

test('selecciona un cliente y muestra saldo e historial', () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', phone: '300', notes: 'Frecuente', balance: 45000 }];
  mockTransactions = [
    { id: 't1', customerId: 'c1', type: 'fiado', amount: 65000, notes: 'Pedido mesa 3', createdAt: null },
    { id: 't2', customerId: 'c1', type: 'abono', amount: 20000, notes: '', createdAt: null },
  ];
  mockTotalCredit = 45000;

  render(<CustomersManager user={user} />);

  fireEvent.click(screen.getByText('María Pérez'));

  expect(screen.getByText('Saldo actual')).toBeInTheDocument();
  expect(screen.getAllByText('$45.000').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Debe')).toBeInTheDocument();
  expect(screen.getByText(/Frecuente/)).toBeInTheDocument();
  const history = screen.getByRole('list', { name: 'Movimientos del cliente' });
  expect(within(history).getByText('Fiado')).toBeInTheDocument();
  expect(within(history).getByText('Abono')).toBeInTheDocument();
  expect(within(history).getByText(/\+\$65\.000/)).toBeInTheDocument();
  expect(within(history).getByText(/Pedido mesa 3/)).toBeInTheDocument();
});

test('registra un abono con monto y notas', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 45000 }];
  mockRegisterCredit.mockImplementation(() => Promise.resolve({ success: true, newBalance: 25000 }));

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));

  fireEvent.change(screen.getByLabelText('Monto *'), { target: { value: '20000' } });
  fireEvent.change(screen.getByLabelText('Notas del movimiento'), {
    target: { value: 'Abono en efectivo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar abono' }));

  await waitFor(() => expect(mockRegisterCredit).toHaveBeenCalledTimes(1));
  expect(mockRegisterCredit).toHaveBeenCalledWith({
    customerId: 'c1',
    type: 'abono',
    amount: '20000',
    notes: 'Abono en efectivo',
    user,
  });
  expect(await screen.findByText('✓ Abono registrado')).toBeInTheDocument();
});

test('registra un cobro total sin pedir monto', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 45000 }];
  mockRegisterCredit.mockImplementation(() => Promise.resolve({ success: true, newBalance: 0 }));

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));

  fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'cobro' } });
  expect(screen.queryByLabelText('Monto *')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Cobrar todo' }));

  await waitFor(() => expect(mockRegisterCredit).toHaveBeenCalledTimes(1));
  expect(mockRegisterCredit).toHaveBeenCalledWith(
    expect.objectContaining({ customerId: 'c1', type: 'cobro' })
  );
  expect(await screen.findByText('✓ Saldo cobrado')).toBeInTheDocument();
});

test('muestra el error del hook al registrar un movimiento', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 45000 }];
  mockRegisterCredit.mockImplementation(() =>
    Promise.resolve({ success: false, error: 'El abono ($50.000) supera el saldo ($45.000)' })
  );

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));

  fireEvent.change(screen.getByLabelText('Monto *'), { target: { value: '50000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar abono' }));

  await waitFor(() =>
    expect(screen.getByText(/El abono \(\$50\.000\) supera el saldo/)).toBeInTheDocument()
  );
});

test('elimina un cliente tras confirmar', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 0 }];

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));
  fireEvent.click(screen.getByRole('button', { name: /Eliminar/ }));

  expect(window.confirm).toHaveBeenCalled();
  await waitFor(() => expect(mockDeleteCustomer).toHaveBeenCalledWith('c1', 0));
});

test('muestra error si el hook rechaza eliminar con saldo', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', balance: 45000 }];
  mockDeleteCustomer.mockImplementation(() =>
    Promise.resolve({ success: false, error: 'No se puede eliminar un cliente con saldo pendiente' })
  );

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));
  fireEvent.click(screen.getByRole('button', { name: /Eliminar/ }));

  await waitFor(() =>
    expect(screen.getByText(/No se puede eliminar un cliente con saldo pendiente/)).toBeInTheDocument()
  );
});

test('edita un cliente existente', async () => {
  mockCustomers = [{ id: 'c1', name: 'María Pérez', phone: '300', balance: 0 }];

  render(<CustomersManager user={user} />);
  fireEvent.click(screen.getByText('María Pérez'));
  fireEvent.click(screen.getByRole('button', { name: /Editar/ }));

  expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'María P. Ruiz' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

  await waitFor(() => expect(mockUpdateCustomer).toHaveBeenCalledTimes(1));
  expect(mockUpdateCustomer).toHaveBeenCalledWith('c1', {
    name: 'María P. Ruiz',
    phone: '300',
    notes: '',
  });
});
