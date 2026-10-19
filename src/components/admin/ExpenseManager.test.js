const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockAddExpense = jest.fn();
const mockDeleteExpense = jest.fn();
const mockUpdateExpense = jest.fn();
let mockExpenses = [];
let mockLoading = false;
let mockError = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'a1', email: 'admin@distritowok.com' },
  }),
}));

jest.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: mockExpenses,
    loading: mockLoading,
    error: mockError,
    addExpense: mockAddExpense,
    deleteExpense: mockDeleteExpense,
    updateExpense: mockUpdateExpense,
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseManager from './ExpenseManager';

beforeEach(() => {
  jest.clearAllMocks();
  mockExpenses = [];
  mockLoading = false;
  mockError = null;
  mockAddExpense.mockImplementation(() => Promise.resolve({ success: true, id: 'e1' }));
  mockDeleteExpense.mockImplementation(() => Promise.resolve({ success: true }));
  mockUpdateExpense.mockImplementation(() => Promise.resolve({ success: true }));
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
});

test('muestra el estado vacío cuando no hay gastos hoy', () => {
  render(<ExpenseManager />);

  expect(screen.getByText('No hay gastos registrados hoy')).toBeInTheDocument();
  expect(screen.getByText(/Total: \$0/)).toBeInTheDocument();
});

test('registra un gasto con concepto, monto y método', async () => {
  render(<ExpenseManager />);

  fireEvent.change(screen.getByPlaceholderText(/Sillas de plástico/), {
    target: { value: 'Sillas de plástico' },
  });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '15000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }));

  await waitFor(() => expect(mockAddExpense).toHaveBeenCalledTimes(1));

  expect(mockAddExpense).toHaveBeenCalledWith({
    concept: 'Sillas de plástico',
    amount: '15000',
    method: 'cash',
    paymentSplit: null,
    notes: '',
    user: { uid: 'a1', email: 'admin@distritowok.com' },
  });
});

test('muestra el error del hook si el gasto no se puede guardar', async () => {
  mockAddExpense.mockImplementation(() => Promise.resolve({ success: false, error: 'El monto debe ser mayor a 0' }));

  render(<ExpenseManager />);

  fireEvent.change(screen.getByPlaceholderText(/Sillas de plástico/), {
    target: { value: 'Gas' },
  });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('El monto debe ser mayor a 0')
  );
});

test('lista los gastos de hoy con total, método y autor', () => {
  mockExpenses = [
    {
      id: 'e1',
      concept: 'Gas para cocina',
      amount: 20000,
      method: 'cash',
      notes: 'Tanque 30kg',
      createdBy: 'admin@distritowok.com',
      createdAt: new Date(),
    },
  ];

  render(<ExpenseManager />);

  expect(screen.getByText('Gas para cocina')).toBeInTheDocument();
  expect(screen.getAllByText(/Efectivo/).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/admin@distritowok.com/)).toBeInTheDocument();
  expect(screen.getByText('Tanque 30kg')).toBeInTheDocument();
  expect(screen.getByText(/Total: \$20\.000/)).toBeInTheDocument();
  expect(screen.getByText(`−$${(20000).toLocaleString()}`)).toBeInTheDocument();
});

test('elimina un gasto con confirmación', async () => {
  mockExpenses = [
    { id: 'e1', concept: 'Compra equivocada', amount: 5000, method: 'cash', createdAt: new Date() },
  ];

  render(<ExpenseManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto Compra equivocada' }));

  await waitFor(() => expect(mockDeleteExpense).toHaveBeenCalledWith('e1'));
  expect(window.confirm).toHaveBeenCalled();
});

test('no elimina si el usuario cancela la confirmación', async () => {
  window.confirm = jest.fn(() => false);
  mockExpenses = [
    { id: 'e1', concept: 'Otra compra', amount: 5000, method: 'cash', createdAt: new Date() },
  ];

  render(<ExpenseManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto Otra compra' }));

  await waitFor(() => expect(window.confirm).toHaveBeenCalled());
  expect(mockDeleteExpense).not.toHaveBeenCalled();
});

test('registra un gasto con pago mixto (efectivo + transferencia)', async () => {
  render(<ExpenseManager />);

  fireEvent.change(screen.getByPlaceholderText(/Sillas de plástico/), {
    target: { value: 'Flete' },
  });
  fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '15000' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mixed' } });
  fireEvent.change(screen.getAllByPlaceholderText('0')[1], { target: { value: '9000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }));

  await waitFor(() => expect(mockAddExpense).toHaveBeenCalledTimes(1));

  expect(mockAddExpense).toHaveBeenCalledWith(
    expect.objectContaining({
      concept: 'Flete',
      amount: '15000',
      method: 'mixed',
      paymentSplit: { cash: 9000, transfer: 6000 },
      user: { uid: 'a1', email: 'admin@distritowok.com' },
    })
  );
});

test('no guarda un gasto mixto sin la parte en efectivo', async () => {
  render(<ExpenseManager />);

  fireEvent.change(screen.getByPlaceholderText(/Sillas de plástico/), {
    target: { value: 'Flete' },
  });
  fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '15000' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mixed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese la parte pagada en efectivo')
  );
  expect(mockAddExpense).not.toHaveBeenCalled();
});

test('edita el método de pago de un gasto existente', async () => {
  mockExpenses = [
    { id: 'e1', concept: 'Gas', amount: 20000, method: 'cash', notes: 'Tanque', createdAt: new Date() },
  ];

  render(<ExpenseManager />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar gasto Gas' }));

  expect(screen.getByDisplayValue('Gas')).toBeInTheDocument();
  expect(screen.getByDisplayValue('20000')).toBeInTheDocument();
  expect(screen.getByText('Editar gasto')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mixed' } });
  fireEvent.change(screen.getAllByPlaceholderText('0')[1], { target: { value: '12000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  await waitFor(() =>
    expect(mockUpdateExpense).toHaveBeenCalledWith('e1', {
      concept: 'Gas',
      amount: '20000',
      method: 'mixed',
      paymentSplit: { cash: 12000, transfer: 8000 },
      notes: 'Tanque',
    })
  );
  expect(mockAddExpense).not.toHaveBeenCalled();
});

test('muestra el detalle del pago mixto en la lista', () => {
  mockExpenses = [
    {
      id: 'e1',
      concept: 'Pago doble',
      amount: 30000,
      method: 'mixed',
      paymentSplit: { cash: 12000, transfer: 18000 },
      createdAt: new Date(),
    },
  ];

  render(<ExpenseManager />);

  expect(
    screen.getByText(/Mixto: Efectivo \$12\.000 \+ Transferencia \$18\.000/)
  ).toBeInTheDocument();
});
