import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpenses } from '../../hooks/useExpenses';
import LoadingScreen from '../common/LoadingScreen';
import {
  ADMIN_PAYMENT_METHODS,
  formatPaymentDetail,
  timestampMs,
  isToday
} from '../../utils/orderUtils';
import { FaMoneyBillWave, FaTrashAlt, FaPen } from 'react-icons/fa';

/**
 * Registro de compras pagadas con la caja menor durante el día.
 * Soporta edición y pago mixto (efectivo + transferencia).
 */
function ExpenseManager() {
  const { currentUser } = useAuth();
  const { expenses, loading, error, addExpense, deleteExpense, updateExpense } = useExpenses();
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [splitCash, setSplitCash] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const todayExpenses = expenses.filter(e => isToday(e.createdAt));
  const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const buildSplit = (methodId, cashValue, baseAmount) => {
    if (methodId !== 'mixed') return { split: null, error: null };
    const cash = Number(cashValue);
    if (!Number.isFinite(cash) || cash <= 0) {
      return { split: null, error: 'Ingrese la parte pagada en efectivo' };
    }
    const transfer = baseAmount - cash;
    if (transfer <= 0) {
      return { split: null, error: 'La parte en transferencia debe ser mayor a 0' };
    }
    return { split: { cash, transfer }, error: null };
  };

  const resetForm = () => {
    setConcept('');
    setAmount('');
    setNotes('');
    setMethod('cash');
    setSplitCash('');
    setEditingId(null);
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setConcept(expense.concept || '');
    setAmount(String(expense.amount ?? ''));
    setMethod(expense.method || 'cash');
    setSplitCash(
      expense.method === 'mixed' && expense.paymentSplit
        ? String(expense.paymentSplit.cash || '')
        : ''
    );
    setNotes(expense.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const baseAmount = Number(amount);
    const { split, error: splitError } = buildSplit(method, splitCash, baseAmount);
    if (splitError) {
      alert(splitError);
      return;
    }

    setSaving(true);
    const data = { concept, amount, method, paymentSplit: split, notes };
    const result = editingId
      ? await updateExpense(editingId, data)
      : await addExpense({ ...data, user: currentUser });
    setSaving(false);

    if (!result.success) {
      alert(result.error);
      return;
    }

    resetForm();
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`¿Eliminar el gasto "${expense.concept}"?`)) return;
    const result = await deleteExpense(expense.id);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Cargando caja menor..." />;
  }

  return (
    <div>
      <h2 className="section-title">Caja Menor (Gastos del Día)</h2>
      <p className="text-dorado-oscuro font-inter text-sm mb-6">
        Registra las compras que se pagan con la caja menor. Aparecen en el cuadre de caja del cajero.
      </p>

      {error && (
        <div className="mb-6 bg-rojo/10 border border-rojo/40 text-ink px-4 py-3 rounded-lg font-inter text-sm">
          Error al cargar gastos: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="panel p-5 space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-dorado-claro flex items-center gap-2">
              <FaMoneyBillWave className="text-dorado" />
              {editingId ? 'Editar gasto' : 'Nuevo gasto'}
            </h3>

            <div>
              <label className="block text-dorado-oscuro text-sm mb-1">Concepto *</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Sillas de plástico, gas, fletes..."
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro focus:outline-none focus:border-dorado/60"
              />
            </div>

            <div>
              <label className="block text-dorado-oscuro text-sm mb-1">Monto *</label>
              <input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter focus:outline-none focus:border-dorado/60"
              />
            </div>

            <div>
              <label className="block text-dorado-oscuro text-sm mb-1">Método de pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro focus:outline-none focus:border-dorado/60"
              >
                {ADMIN_PAYMENT_METHODS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {method === 'mixed' && (
              <div className="bg-surface-3 border border-dorado/40 rounded-lg p-3 space-y-2">
                <label className="block text-dorado-oscuro text-sm">
                  Parte en efectivo *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter focus:outline-none focus:border-dorado/60"
                />
                <div className="flex justify-between text-dorado-oscuro text-xs font-inter">
                  <span>Transferencia:</span>
                  <span className="text-dorado">
                    ${Math.max((Number(amount) || 0) - (Number(splitCash) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-dorado-oscuro text-sm mb-1">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Opcional"
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro focus:outline-none focus:border-dorado/60 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-dorado hover:bg-dorado-oscuro disabled:opacity-50 disabled:cursor-not-allowed text-negro font-bold py-3 rounded-lg transition"
            >
              {saving
                ? 'Guardando...'
                : editingId
                  ? 'Guardar cambios'
                  : 'Registrar gasto'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full bg-surface-3 hover:bg-ink/10 text-dorado-claro font-semibold py-2 rounded-lg border border-dorado-oscuro/40 transition"
              >
                Cancelar edición
              </button>
            )}
          </form>
        </div>

        {/* Lista de gastos */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-cormorant text-dorado">Gastos de hoy</h3>
            <span className="font-inter text-dorado font-semibold">
              Total: ${todayTotal.toLocaleString()}
            </span>
          </div>

          <div className="panel overflow-hidden">
            {todayExpenses.length === 0 ? (
              <p className="text-dorado-oscuro text-center py-6 font-inter">
                No hay gastos registrados hoy
              </p>
            ) : (
              <div className="divide-y divide-dorado-oscuro/20">
                {todayExpenses.map(expense => (
                  <div key={expense.id} className="px-5 py-4 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-dorado-claro font-medium truncate">{expense.concept}</div>
                      <div className="text-dorado-oscuro text-sm font-inter">
                        {timestampMs(expense.createdAt)
                          ? new Date(timestampMs(expense.createdAt)).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                        {' · '}{formatPaymentDetail(expense.method, expense.paymentSplit)}
                        {expense.createdBy ? ` · ${expense.createdBy}` : ''}
                      </div>
                      {expense.notes && (
                        <div className="text-dorado-oscuro text-xs font-inter">{expense.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-inter text-rose-300 font-semibold">
                        −${Number(expense.amount || 0).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-dorado-oscuro hover:text-dorado transition p-2"
                        aria-label={`Editar gasto ${expense.concept}`}
                      >
                        <FaPen />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-dorado-oscuro hover:text-rose-400 transition p-2"
                        aria-label={`Eliminar gasto ${expense.concept}`}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseManager;
