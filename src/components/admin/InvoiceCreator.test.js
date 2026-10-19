const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    menu: {
      arroces: [
        { id: 'arr1', name: 'Arroz Costeño Wok', price: '30K', available: true },
        { id: 'arr2', name: 'Arroz Chaufa', price: '30K / 40K', available: true },
        { id: 'arr3', name: 'Arroz No Disponible', price: '20K', available: false },
      ],
      corrientes: [],
      porciones: [],
      bebidas: [],
    },
    loading: false,
  }),
}));

jest.mock('../../utils/exportUtils', () => ({
  ...jest.requireActual('../../utils/exportUtils'),
  downloadTextFile: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import InvoiceCreator from './InvoiceCreator';
import { downloadTextFile } from '../../utils/exportUtils';

const mockCreate = jest.fn();
const tables = [{ id: 't1', number: 1 }, { id: 't2', number: 2 }];

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockImplementation(() => Promise.resolve({ success: true, id: 'inv1' }));
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
});

test('agrega un producto y calcula el total sin sumar IVA', () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} user={{ uid: 'a1', email: 'admin@x.com' }} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));

  expect(screen.getByRole('button', { name: 'Sumar Arroz Costeño Wok' })).toBeInTheDocument();
  expect(screen.getByText('IVA (incluido):')).toBeInTheDocument();
  expect(screen.getByText('$0')).toBeInTheDocument();
  const panel = screen.getByText('Nueva Factura').parentElement;
  expect(within(panel).getByText(`$${(30000).toLocaleString()}`)).toBeInTheDocument();
});

test('ofrece selector de tamaño para precios dobles', () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  expect(screen.getByRole('button', { name: 'Pequeña Arroz Chaufa' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Grande Arroz Chaufa' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Grande Arroz Chaufa' }));

  expect(screen.getByText(/Arroz Chaufa \(Grande\)/)).toBeInTheDocument();
  expect(screen.getAllByText(`$${(40000).toLocaleString()}`)).toHaveLength(2);
});

test('registra la factura directamente como pago sin mesa', async () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} user={{ uid: 'a1', email: 'admin@x.com' }} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Factura' }));

  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));

  const [payload, user] = mockCreate.mock.calls[0];
  expect(payload).toMatchObject({
    type: 'pickup',
    tableId: null,
    tableNumber: 0,
    paymentMethod: 'cash',
    subtotal: 30000,
    total: 30000,
    notes: '',
  });
  expect(payload.items).toHaveLength(1);
  expect(user).toMatchObject({ uid: 'a1' });
  expect(await screen.findByText('✓ Factura registrada')).toBeInTheDocument();
  expect(window.alert).not.toHaveBeenCalled();
  expect(screen.getByText('Nueva Factura').parentElement).toHaveTextContent('Agregue productos para facturar');
});

test('acepta mesa de referencia sin tocarla', async () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[1], { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Factura' }));

  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));

  const [payload] = mockCreate.mock.calls[0];
  expect(payload.type).toBe('table');
  expect(payload.tableNumber).toBe(2);
  expect(payload.tableId).toBeNull();
});

test('permite cambiar el método de pago', async () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: 'transfer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Factura' }));

  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));

  const [payload] = mockCreate.mock.calls[0];
  expect(payload.paymentMethod).toBe('transfer');
});

test('registra un pago mixto con las partes en efectivo y transferencia', async () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'mixed' } });
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '12000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Factura' }));

  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));

  const [payload] = mockCreate.mock.calls[0];
  expect(payload.paymentMethod).toBe('mixed');
  expect(payload.paymentSplit).toEqual({ cash: 12000, transfer: 18000 });
});

test('no registra un pago mixto con partes inválidas', async () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar Arroz Costeño Wok' }));
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'mixed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Factura' }));

  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith('Ingrese la parte pagada en efectivo')
  );
  expect(mockCreate).not.toHaveBeenCalled();
});

test('edita el método de pago de una factura existente', async () => {
  const invoices = [
    {
      id: 'inv1',
      status: 'paid',
      source: 'admin',
      type: 'pickup',
      total: 25000,
      paymentMethod: 'cash',
      items: [{ name: 'Gaseosa', price: 5000, quantity: 1 }],
      createdAt: new Date(),
    },
  ];
  const mockUpdate = jest.fn(() => Promise.resolve({ success: true }));

  render(
    <InvoiceCreator
      tables={tables}
      invoices={invoices}
      onCreateInvoice={mockCreate}
      onUpdateInvoice={mockUpdate}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Editar pago/ }));

  fireEvent.change(
    screen.getByRole('combobox', { name: /Método de pago de/ }),
    { target: { value: 'mixed' } }
  );
  fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '10000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

  await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
  expect(mockUpdate).toHaveBeenCalledWith('inv1', {
    paymentMethod: 'mixed',
    paymentSplit: { cash: 10000, transfer: 15000 },
  });
});

test('no permite registrar sin productos', () => {
  render(
    <InvoiceCreator tables={tables} invoices={[]} onCreateInvoice={mockCreate} />
  );

  const button = screen.getByRole('button', { name: /Registrar Factura/ });
  expect(button).toBeDisabled();

  fireEvent.click(button);
  expect(mockCreate).not.toHaveBeenCalled();
});

test('muestra las últimas facturas del administrador', () => {
  const invoices = [
    {
      id: 'inv1',
      status: 'paid',
      source: 'admin',
      type: 'pickup',
      total: 25000,
      paymentMethod: 'cash',
      items: [{ name: 'Gaseosa', price: 5000, quantity: 1 }],
      createdAt: new Date(),
    },
    {
      id: 'inv2',
      status: 'paid',
      source: 'client',
      type: 'pickup',
      total: 99999,
      paymentMethod: 'cash',
      items: [],
      createdAt: new Date(),
    },
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  expect(screen.getByText('Historial de Facturas')).toBeInTheDocument();
  expect(screen.getByText(`$${(25000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.queryByText(`$${(99999).toLocaleString()}`)).not.toBeInTheDocument();
});

test('muestra el detalle de una factura al expandirlo', () => {
  const invoices = [
    {
      id: 'invDetail1',
      status: 'paid',
      source: 'admin',
      type: 'pickup',
      items: [{ id: 'g1', name: 'Gaseosa', price: 5000, quantity: 2 }],
      notes: 'Sin hielo',
      subtotal: 10000,
      tax: 0,
      total: 10000,
      paymentMethod: 'cash',
      createdAt: new Date(),
    },
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  expect(
    screen.queryByRole('group', { name: 'Detalle del pedido' })
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Ver detalle/ }));

  const detail = screen.getByRole('group', { name: 'Detalle del pedido' });
  expect(within(detail).getByText(/2x Gaseosa/)).toBeInTheDocument();
  expect(within(detail).getByText('Sin hielo')).toBeInTheDocument();
  expect(within(detail).getByText('Subtotal:')).toBeInTheDocument();
  expect(within(detail).getByText('Total:')).toBeInTheDocument();
  expect(within(detail).getAllByText('Total:')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: /Ocultar detalle/ }));
  expect(
    screen.queryByRole('group', { name: 'Detalle del pedido' })
  ).not.toBeInTheDocument();
});

const makeInvoice = (id, overrides = {}) => ({
  id,
  status: 'paid',
  source: 'admin',
  type: 'pickup',
  total: 10000,
  paymentMethod: 'cash',
  items: [{ name: 'Gaseosa', price: 10000, quantity: 1 }],
  createdAt: new Date(),
  ...overrides,
});

test('filtra el historial por método y texto', () => {
  const invoices = [
    makeInvoice('invCash', { total: 20000, notes: 'Cliente preferente' }),
    makeInvoice('invTransfer', { paymentMethod: 'transfer', total: 35000 }),
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  expect(screen.getByText(`$${(20000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.getByText(`$${(35000).toLocaleString()}`)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Método'), { target: { value: 'transfer' } });
  expect(screen.queryByText(`$${(20000).toLocaleString()}`)).not.toBeInTheDocument();
  expect(screen.getByText(`$${(35000).toLocaleString()}`)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'preferente' } });
  expect(screen.getByText(`$${(20000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.queryByText(`$${(35000).toLocaleString()}`)).not.toBeInTheDocument();
});

test('filtra el historial por rango de fechas', () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const invoices = [
    makeInvoice('invToday', { total: 15000 }),
    makeInvoice('invYesterday', { total: 8000, createdAt: yesterday }),
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: todayKey } });

  expect(screen.getByText(`$${(15000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.queryByText(`$${(8000).toLocaleString()}`)).not.toBeInTheDocument();
});

test('pagina el historial de más de 10 facturas', () => {
  const invoices = Array.from({ length: 12 }, (_, i) =>
    makeInvoice(`inv${i}`, { total: 10000 + i })
  );

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Ver detalle/ })).toHaveLength(10);

  fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }));
  expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Ver detalle/ })).toHaveLength(2);
});

test('anula una factura exigiendo motivo', async () => {
  const mockCancel = jest.fn(() => Promise.resolve({ success: true }));
  const invoices = [makeInvoice('invCancel', { total: 45000 })];

  render(
    <InvoiceCreator
      tables={tables}
      invoices={invoices}
      onCreateInvoice={mockCreate}
      onCancelInvoice={mockCancel}
      user={{ uid: 'a1', email: 'admin@x.com' }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Anular invCancel|Anular/ }));

  const confirmButton = screen.getByRole('button', { name: 'Confirmar anulación' });
  expect(confirmButton).toBeDisabled();

  fireEvent.change(screen.getByPlaceholderText(/Error de captura/), {
    target: { value: 'Cobro duplicado' },
  });
  fireEvent.click(confirmButton);

  await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(1));
  expect(mockCancel).toHaveBeenCalledWith('invCancel', {
    reason: 'Cobro duplicado',
    user: { uid: 'a1', email: 'admin@x.com' },
  });
  expect(await screen.findByText('✓ Factura anulada')).toBeInTheDocument();
});

test('muestra el error si la anulación falla', async () => {
  const mockCancel = jest.fn(() =>
    Promise.resolve({ success: false, error: 'Solo se pueden anular facturas pagadas' })
  );
  const invoices = [makeInvoice('invFail')];

  render(
    <InvoiceCreator
      tables={tables}
      invoices={invoices}
      onCreateInvoice={mockCreate}
      onCancelInvoice={mockCancel}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Anular/ }));
  fireEvent.change(screen.getByPlaceholderText(/Error de captura/), {
    target: { value: 'Error' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar anulación' }));

  await waitFor(() =>
    expect(
      screen.getByText(/No se pudo anular: Solo se pueden anular facturas pagadas/)
    ).toBeInTheDocument()
  );
});

test('oculta las facturas anuladas salvo que se pidan incluirlas', () => {
  const invoices = [
    makeInvoice('invPaid', { total: 12000 }),
    makeInvoice('invCancelled', {
      total: 34000,
      status: 'cancelled',
      cancelledReason: 'Error de captura',
      cancelledByName: 'admin@x.com',
    }),
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  expect(screen.getByText(`$${(12000).toLocaleString()}`)).toBeInTheDocument();
  expect(screen.queryByText(`$${(34000).toLocaleString()}`)).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Incluir anuladas'));

  expect(screen.getByText('cancelled')).toBeInTheDocument();
  expect(screen.getByText(/Error de captura/)).toBeInTheDocument();
  expect(screen.getByText(`$${(34000).toLocaleString()}`)).toBeInTheDocument();
});

test('no ofrece editar pago ni anular de una factura ya anulada', () => {
  const mockCancel = jest.fn();
  const invoices = [
    makeInvoice('invCancelled', { status: 'cancelled', cancelledReason: 'x' }),
  ];

  render(
    <InvoiceCreator
      tables={tables}
      invoices={invoices}
      onCreateInvoice={mockCreate}
      onCancelInvoice={mockCancel}
    />
  );

  expect(screen.queryByRole('button', { name: /Editar pago/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Anular/ })).not.toBeInTheDocument();
});

test('exporta el historial filtrado a CSV', () => {
  const invoices = [
    makeInvoice('invExport1', { total: 21000 }),
    makeInvoice('invExport2', { total: 33000, paymentMethod: 'transfer' }),
  ];

  render(
    <InvoiceCreator tables={tables} invoices={invoices} onCreateInvoice={mockCreate} />
  );

  fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));

  expect(downloadTextFile).toHaveBeenCalledTimes(1);
  const [filename, content] = downloadTextFile.mock.calls[0];
  expect(filename).toMatch(/^facturas-distrito-wok-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(content).toContain('Número');
  expect(content).toContain('invExport1');
  expect(content).toContain('invExport2');
  expect(content).toContain('Transferencia');
});
