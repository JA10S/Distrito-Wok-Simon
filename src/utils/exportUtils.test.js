import { toCsv, downloadTextFile, buildCashClosingSheets, downloadXlsx } from './exportUtils';

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({ ref: 'A1' })),
    book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}));

const XLSX = require('xlsx');

describe('toCsv', () => {
  test('une encabezados y filas con el delimitador', () => {
    const csv = toCsv(['A', 'B'], [['1', '2'], ['3', '4']]);
    expect(csv).toBe('\uFEFFA,B\r\n1,2\r\n3,4');
  });

  test('escapa comillas y envuelve valores con delimitador o salto de línea', () => {
    const csv = toCsv(['Nota'], [['Dice "hola", bien\ny adiós']]);
    expect(csv).toBe('\uFEFFNota\r\n"Dice ""hola"", bien\ny adiós"');
  });

  test('acepta números y valores vacíos', () => {
    const csv = toCsv(['Total', 'Motivo'], [[25000, '']]);
    expect(csv).toBe('\uFEFFTotal,Motivo\r\n25000,');
  });
});

describe('downloadTextFile', () => {
  test('crea un blob, dispara el clic y libera la URL', () => {
    const createObjectURL = jest.fn(() => 'blob:mock-url');
    const revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    downloadTextFile('reporte.csv', '\uFEFFa,b\r\n1,2');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
  });
});

describe('buildCashClosingSheets', () => {
  const closing = {
    id: '2026-10-17',
    date: '2026-10-17',
    closedAt: new Date(2026, 9, 17, 22, 30),
    closedBy: 'admin@distritowok.com',
    countedCash: 44000,
    difference: -1000,
    notes: 'Sin novedades',
    summary: {
      totalSales: 120000,
      cash: 50000,
      transfer: 30000,
      card: 20000,
      bold: 20000,
      expenses: 6000,
      cashExpenses: 6000,
      cashExpected: 44000,
      ordersCount: 5,
      avgTicket: 24000
    }
  };

  const orders = [
    {
      id: 'old001',
      createdAt: new Date(2026, 9, 17, 12, 0),
      total: 50000,
      paymentMethod: 'cash',
      type: 'table',
      tableNumber: 3
    },
    {
      id: 'new002',
      createdAt: new Date(2026, 9, 17, 19, 45),
      total: 30000,
      paymentMethod: 'transfer',
      type: 'delivery',
      customer: { name: 'Ana' }
    },
    {
      id: 'broken1',
      createdAt: null,
      total: 10000,
      paymentMethod: 'cash'
    }
  ];

  test('arma la hoja de cierres con montos como números', () => {
    const { summaryRows } = buildCashClosingSheets([closing], []);

    expect(summaryRows).toHaveLength(1);
    const row = summaryRows[0];
    expect(row.Fecha).toBe('2026-10-17');
    expect(row.Hora).toMatch(/\d/);
    expect(row['Cerrada por']).toBe('admin@distritowok.com');
    expect(row['Ventas totales']).toBe(120000);
    expect(row.Efectivo).toBe(50000);
    expect(row.Diferencia).toBe(-1000);
    expect(row['Efectivo contado']).toBe(44000);
    expect(row.Pedidos).toBe(5);
    expect(row.Notas).toBe('Sin novedades');
    expect(typeof row.Efectivo).toBe('number');
  });

  test('calcula la diferencia cuando no viene guardada', () => {
    const { summaryRows } = buildCashClosingSheets([
      { ...closing, difference: undefined }
    ], []);

    expect(summaryRows[0].Diferencia).toBe(44000 - 44000);
  });

  test('arma la hoja de ventas con pedidos ordenados del más reciente', () => {
    const { salesRows } = buildCashClosingSheets([closing], orders);

    expect(salesRows).toHaveLength(2);
    expect(salesRows[0].Pedido).toBe('#NEW002');
    expect(salesRows[0].Fecha).toBe('2026-10-17');
    expect(salesRows[0].Tipo).toContain('Domicilio');
    expect(salesRows[0].Tipo).toContain('Ana');
    expect(salesRows[0]['Método de pago']).toBe('Transferencia');
    expect(salesRows[0].Total).toBe(30000);
    expect(salesRows[1].Tipo).toBe('Mesa 3');
    expect(salesRows[1]['Método de pago']).toBe('Efectivo');
    expect(salesRows[1].Total).toBe(50000);
  });

  test('usa orderNumber cuando existe', () => {
    const { salesRows } = buildCashClosingSheets([], [
      { ...orders[0], orderNumber: 'ABC123' }
    ]);

    expect(salesRows[0].Pedido).toBe('ABC123');
  });

  test('con listados vacíos devuelve hojas vacías', () => {
    const { summaryRows, salesRows } = buildCashClosingSheets([], []);
    expect(summaryRows).toEqual([]);
    expect(salesRows).toEqual([]);
  });
});

describe('downloadXlsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // resetMocks de CRA borra implementaciones antes de cada test → se re-aplican
    XLSX.utils.json_to_sheet.mockImplementation(() => ({ ref: 'A1' }));
    XLSX.utils.book_new.mockImplementation(() => ({ SheetNames: [], Sheets: {} }));
    XLSX.utils.book_append_sheet.mockImplementation(() => {});
    XLSX.writeFile.mockImplementation(() => {});
  });

  test('crea el libro con una hoja por entrada y descarga con el nombre dado', () => {
    const rows = [{ A: 1 }];
    downloadXlsx(
      [
        { name: 'Cierres', rows },
        { name: 'Ventas', rows: [] }
      ],
      'cierres-caja-2026-10-18.xlsx'
    );

    expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.utils.json_to_sheet).toHaveBeenNthCalledWith(1, rows);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.utils.book_append_sheet.mock.calls[0][2]).toBe('Cierres');
    expect(XLSX.utils.book_append_sheet.mock.calls[1][2]).toBe('Ventas');
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile.mock.calls[0][1]).toBe('cierres-caja-2026-10-18.xlsx');
  });

  test('una hoja sin filas recibe un objeto vacío (libro siempre válido)', () => {
    downloadXlsx([{ name: 'Ventas', rows: [] }], 'x.xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([{}]);
  });
});
