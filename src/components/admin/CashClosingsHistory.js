import React, { useState, useEffect, useMemo } from 'react';
import { useCashClosings, useCashClosing, dayKey, closingTime } from '../../hooks/useCashClosing';
import { useOrders } from '../../hooks/useOrders';
import { useExpenses } from '../../hooks/useExpenses';
import { useAuth } from '../../contexts/AuthContext';
import { computeDayTotals } from '../../utils/orderUtils';
import { buildCashClosingSheets, downloadXlsx } from '../../utils/exportUtils';
import LoadingScreen from '../common/LoadingScreen';
import { FaCashRegister, FaFileExcel, FaInbox } from 'react-icons/fa';

function CashClosingsHistory() {
  const { currentUser, hasPermission } = useAuth();
  const { closings, loading } = useCashClosings(365);
  const { orders: paidOrders, loading: ordersLoading } = useOrders('paid');
  const { expenses } = useExpenses();
  const { closeRegister } = useCashClosing();

  const today = dayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const existing = useMemo(
    () => closings.find((c) => c.date === selectedDate) || null,
    [closings, selectedDate]
  );

  const totals = useMemo(
    () => computeDayTotals(paidOrders, expenses, selectedDate),
    [paidOrders, expenses, selectedDate]
  );

  // Precarga el cierre existente sin pisar lo que el usuario esté escribiendo
  const existingKey = existing
    ? `${existing.id}:${existing.countedCash}:${existing.notes || ''}`
    : 'new';
  useEffect(() => {
    if (existing) {
      setCountedCash(String(existing.countedCash ?? ''));
      setCloseNotes(existing.notes || '');
    } else {
      setCountedCash('');
      setCloseNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingKey, selectedDate]);

  const countedNum = countedCash === '' || countedCash === null || countedCash === undefined
    ? null
    : Number(countedCash);
  const difference = countedNum !== null && Number.isFinite(countedNum)
    ? countedNum - totals.cashExpected
    : null;

  const handleSave = async () => {
    if (!selectedDate) {
      alert('Seleccione la fecha del cierre');
      return;
    }
    if (countedNum === null || !Number.isFinite(countedNum) || countedNum < 0) {
      alert('Ingrese el efectivo contado en la gaveta');
      return;
    }
    const isUpdate = !!existing;
    const ok = window.confirm(
      isUpdate
        ? `¿Actualizar el cierre del ${selectedDate}?`
        : `¿Registrar el cierre del ${selectedDate}? Efectivo contado: $${countedNum.toLocaleString()} · Esperado: $${totals.cashExpected.toLocaleString()}`
    );
    if (!ok) return;

    setSaving(true);
    const result = await closeRegister({
      summary: {
        totalSales: totals.totalSales,
        cash: totals.cash,
        transfer: totals.transfer,
        bold: totals.bold,
        card: totals.card,
        expenses: totals.expenseTotal,
        cashExpenses: totals.cashExpenseTotal,
        cashExpected: totals.cashExpected,
        ordersCount: totals.ordersCount,
        avgTicket: totals.avgTicket
      },
      countedCash: countedNum,
      notes: closeNotes,
      user: currentUser,
      date: selectedDate
    });
    setSaving(false);

    alert(
      result.success
        ? (isUpdate ? 'Cierre actualizado' : 'Cierre registrado')
        : 'Error al guardar el cierre: ' + result.error
    );
  };

  const handleExport = () => {
    if (closings.length === 0) return;
    const { summaryRows, salesRows } = buildCashClosingSheets(closings, paidOrders);
    downloadXlsx(
      [
        { name: 'Cierres', rows: summaryRows },
        { name: 'Ventas', rows: salesRows }
      ],
      `cierres-caja-${dayKey()}.xlsx`
    );
  };

  const diffPill = (diff) => {
    const value = Number(diff || 0);
    if (value < 0) {
      return (
        <span className="font-inter rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1 text-xs">
          Faltante ${value.toLocaleString()}
        </span>
      );
    }
    if (value > 0) {
      return (
        <span className="font-inter rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 text-xs">
          Sobrante ${value.toLocaleString()}
        </span>
      );
    }
    return (
      <span className="font-inter rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 text-xs">
        Cuadra
      </span>
    );
  };

  return (
    <div>
      {/* Cierre manual para días anteriores (permiso cash_register) */}
      {hasPermission('cash_register') && (
        <div className="panel p-6 mb-6">
          <h3 className="text-lg font-cormorant text-dorado mb-1">Registrar cierre de un día</h3>
          <p className="text-dorado-oscuro text-sm mb-4">
            Para días que quedaron sin cerrar. Los totales se calculan con las ventas y compras registradas en esa fecha.
          </p>

          {ordersLoading ? (
            <LoadingScreen message="Cargando totales del día..." fullScreen={false} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="close-date" className="block text-dorado-claro text-sm mb-1">
                    Fecha del cierre
                  </label>
                  <input
                    id="close-date"
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-surface-3 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro font-inter focus:outline-none focus:border-dorado/60"
                  />
                </div>
                <div>
                  <label htmlFor="admin-counted-cash" className="block text-dorado-claro text-sm mb-1">
                    Efectivo contado (físico en gaveta) *
                  </label>
                  <input
                    id="admin-counted-cash"
                    type="number"
                    min="0"
                    step="100"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-3 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter focus:outline-none focus:border-dorado/60"
                  />
                </div>
              </div>

              {/* Totales del día seleccionado */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-3 py-2">
                  <div className="text-dorado-oscuro text-xs">Ventas</div>
                  <div className="text-dorado-claro font-inter font-semibold">${totals.totalSales.toLocaleString()}</div>
                </div>
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-3 py-2">
                  <div className="text-dorado-oscuro text-xs">Efectivo</div>
                  <div className="text-dorado-claro font-inter font-semibold">${totals.cash.toLocaleString()}</div>
                </div>
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-3 py-2">
                  <div className="text-dorado-oscuro text-xs">Compras (caja menor)</div>
                  <div className="text-rose-300 font-inter font-semibold">−${totals.expenseTotal.toLocaleString()}</div>
                </div>
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-3 py-2">
                  <div className="text-dorado-oscuro text-xs">Efectivo esperado</div>
                  <div className="text-dorado font-inter font-semibold">${totals.cashExpected.toLocaleString()}</div>
                </div>
              </div>

              {totals.ordersCount === 0 && totals.expenseTotal === 0 && (
                <p className="text-dorado-oscuro text-sm mt-3">
                  No hay ventas ni compras registradas en esta fecha (se cerrará en $0)
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
                <div>
                  <span className="block text-dorado-claro text-sm mb-1">Diferencia</span>
                  <div
                    className={`px-3 py-2 rounded border font-inter font-bold ${
                      difference === null
                        ? 'bg-surface-3 border-dorado-oscuro/30 text-dorado-oscuro'
                        : difference < 0
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                    role="status"
                  >
                    {difference === null
                      ? '—'
                      : `${difference < 0 ? 'Faltante' : difference > 0 ? 'Sobrante' : 'Cuadra'}: $${difference.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <label htmlFor="admin-close-notes" className="block text-dorado-claro text-sm mb-1">
                    Notas (opcional)
                  </label>
                  <input
                    id="admin-close-notes"
                    type="text"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Observaciones del cierre..."
                    className="w-full bg-surface-3 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro text-sm focus:outline-none focus:border-dorado/60"
                  />
                </div>
              </div>

              <p className={`text-sm mt-4 ${existing ? 'text-emerald-300' : 'text-dorado-oscuro'}`}>
                {existing
                  ? `Ya existe un cierre para el ${selectedDate} (contado: $${Number(existing.countedCash || 0).toLocaleString()}) — al guardar se actualizará.`
                  : 'Sin cierre registrado para esta fecha.'}
              </p>

              <button
                onClick={handleSave}
                disabled={saving || !selectedDate}
                className="w-full mt-3 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                {saving
                  ? 'Guardando...'
                  : existing
                    ? 'Actualizar Cierre'
                    : 'Registrar Cierre'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Historial de cierres */}
      <div className="panel overflow-hidden">
        {closings.length > 0 && (
          <div className="p-4 border-b border-dorado-oscuro/20 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-cormorant text-dorado">Historial de cierres</h3>
            {hasPermission('cash_register') && (
              <button
                onClick={handleExport}
                disabled={ordersLoading}
                className="btn-success disabled:opacity-50 px-4 py-2 text-sm font-inter flex items-center gap-2"
              >
                <FaFileExcel aria-hidden="true" /> Exportar Excel
              </button>
            )}
          </div>
        )}
        {closings.length === 0 ? (
          <div className="text-center py-8">
            <FaInbox className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
            <p className="text-dorado-oscuro">Aún no hay cierres de caja registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-dorado-oscuro/20">
            {closings.map((c) => {
              const s = c.summary || {};
              return (
                <div key={c.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[170px]">
                    <FaCashRegister className="text-dorado" aria-hidden="true" />
                    <div>
                      <div className="font-inter text-dorado-claro font-semibold">{c.date}</div>
                      <div className="text-dorado-oscuro text-xs">
                        {closingTime(c.closedAt) && `Cerrada ${closingTime(c.closedAt)}`}
                        {c.closedBy && ` · ${c.closedBy}`}
                      </div>
                    </div>
                  </div>
                  <div className="font-inter text-dorado-claro text-sm">
                    Ventas: <span className="font-semibold">${Number(s.totalSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="font-inter text-dorado-claro text-sm">
                    Esperado: <span className="font-semibold">${Number(s.cashExpected || 0).toLocaleString()}</span>
                  </div>
                  <div className="font-inter text-dorado-claro text-sm">
                    Contado: <span className="font-semibold">${Number(c.countedCash || 0).toLocaleString()}</span>
                  </div>
                  {diffPill(c.difference)}
                  {c.notes && <div className="text-dorado-oscuro text-xs w-full">🗒️ {c.notes}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CashClosingsHistory;
