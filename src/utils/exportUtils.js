/**
 * Utilidades de exportación de datos (CSV y XLSX descargables en el navegador).
 * Sin dependencias externas para CSV; XLSX usa SheetJS (xlsx).
 */
import * as XLSX from 'xlsx';
import { timestampMs, getOrderLabel, formatPaymentDetail } from './orderUtils';

/** Clave local del día (YYYY-MM-DD) a partir de un timestamp — sin depender de hooks. */
function localDayKey(value) {
  const ms = timestampMs(value);
  if (!ms) return '';
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Hora local (HH:MM) a partir de un timestamp. */
function localTime(value) {
  const ms = timestampMs(value);
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Convierte filas de objetos a contenido CSV escapado.
 * @param {string[]} headers - encabezados visibles
 * @param {string[][]} rows - filas de valores ya convertidos a string
 * @param {string} delimiter - separador (',' por defecto)
 */
export function toCsv(headers, rows, delimiter = ',') {
  const escape = (value) => {
    const text = String(value ?? '');
    // Si contiene el delimitador, comillas o saltos de línea, va entre comillas
    if (text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [headers.map(escape).join(delimiter)];
  rows.forEach((row) => lines.push(row.map(escape).join(delimiter)));
  // BOM para que Excel (Windows) reconozca UTF-8 con tildes/emojis
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Dispara la descarga de un archivo de texto en el navegador.
 * En jsdom (tests) solo valida la estructura, no descarga de verdad.
 */
export function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Arma las dos hojas del Excel de cierres de caja.
 * @param {Array} closings - cierres de cash_closings (resumen por día)
 * @param {Array} orders - pedidos pagados (detalle fila por pedido)
 * @returns {{summaryRows: object[], salesRows: object[]}} filas como objetos
 *          (los montos van como NÚMEROS para que Excel pueda sumarlos).
 */
export function buildCashClosingSheets(closings = [], orders = []) {
  const summaryRows = (closings || []).map((c) => {
    const s = c.summary || {};
    const counted = Number(c.countedCash || 0);
    const expected = Number(s.cashExpected || 0);
    return {
      Fecha: c.date || '',
      Hora: localTime(c.closedAt),
      'Cerrada por': c.closedBy || '',
      'Ventas totales': Number(s.totalSales || 0),
      Efectivo: Number(s.cash || 0),
      Transferencia: Number(s.transfer || 0),
      Tarjeta: Number(s.card || 0),
      'Bold/Nequi u otros': Number(s.bold || 0),
      'Compras (caja menor)': Number(s.expenses || 0),
      'Compras en efectivo': Number(s.cashExpenses || 0),
      'Efectivo esperado': expected,
      'Efectivo contado': counted,
      Diferencia: Number.isFinite(Number(c.difference))
        ? Number(c.difference)
        : counted - expected,
      Pedidos: Number(s.ordersCount || 0),
      'Ticket promedio': Number(s.avgTicket || 0),
      Notas: c.notes || ''
    };
  });

  const salesRows = (orders || [])
    .filter((o) => timestampMs(o.createdAt))
    .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt))
    .map((o) => ({
      Fecha: localDayKey(o.createdAt),
      Hora: localTime(o.createdAt),
      Pedido: o.orderNumber || `#${String(o.id || '').slice(-6).toUpperCase()}`,
      Tipo: getOrderLabel(o),
      'Método de pago': formatPaymentDetail(o.paymentMethod, o.paymentSplit),
      Total: Number(o.total || 0)
    }));

  return { summaryRows, salesRows };
}

/**
 * Descarga un archivo .xlsx con varias hojas (SheetJS).
 * Cada hoja: { name, rows } con rows como array de objetos (una fila por objeto).
 */
export function downloadXlsx(sheets = [], filename = 'reporte.xlsx') {
  const wb = XLSX.utils.book_new();
  (sheets || []).forEach(({ name, rows }) => {
    const data = rows && rows.length > 0 ? rows : [{}];
    const ws = XLSX.utils.json_to_sheet(data);
    if (rows && rows.length > 0) {
      ws['!cols'] = Object.keys(data[0]).map((key) => ({
        wch: Math.max(10, Math.min(30, String(key).length + 4))
      }));
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}
