import React, { useState } from 'react';
import { useCredit, CREDIT_TX_LABELS } from '../../hooks/useCredit';
import LoadingScreen from '../common/LoadingScreen';
import { FaUsers, FaPlus, FaSearch, FaHandHoldingUsd, FaHistory } from 'react-icons/fa';
import { timestampMs } from '../../utils/orderUtils';

const normalize = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function CustomersManager({ user }) {
  const {
    customers, transactions, loading, totalCredit,
    addCustomer, updateCustomer, deleteCustomer, registerCredit
  } = useCredit();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payType, setPayType] = useState('abono');
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  const selected = customers.find((c) => c.id === selectedId) || null;
  const selectedTx = transactions.filter((t) => t.customerId === selectedId);

  const filtered = customers.filter((c) => {
    const q = normalize(search.trim());
    if (!q) return true;
    return normalize(c.name).includes(q) || normalize(c.phone).includes(q);
  });

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', notes: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = editingId
      ? await updateCustomer(editingId, form)
      : await addCustomer(form);
    setSaving(false);
    if (!result.success) {
      showNotice('error', result.error);
      return;
    }
    showNotice('success', editingId ? '✓ Cliente actualizado' : '✓ Cliente creado');
    resetForm();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', notes: c.notes || '' });
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar al cliente "${c.name}"?`)) return;
    const result = await deleteCustomer(c.id, c.balance);
    if (!result.success) {
      showNotice('error', result.error);
      return;
    }
    if (selectedId === c.id) setSelectedId(null);
    showNotice('success', '✓ Cliente eliminado');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const result = await registerCredit({
      customerId: selected.id,
      type: payType,
      amount: payAmount,
      notes: payNotes,
      user
    });
    setSaving(false);
    if (!result.success) {
      showNotice('error', result.error);
      return;
    }
    showNotice('success', payType === 'cobro' ? '✓ Saldo cobrado' : '✓ Abono registrado');
    setPayAmount('');
    setPayNotes('');
    setPayType('abono');
  };

  if (loading) return <LoadingScreen fullScreen={false} message="Cargando cartera..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-cormorant text-dorado">Cartera de Clientes (Fiado)</h2>
          <p className="text-dorado-oscuro font-inter text-sm">
            Saldo total pendiente: <span className="text-dorado font-semibold">${totalCredit.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {notice && (
        <div role="status" className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-inter ${
          notice.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
        }`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 mb-4">
            <h3 className="font-cormorant text-lg font-bold text-dorado-claro mb-3">
              {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <label htmlFor="customer-name" className="block text-dorado-oscuro text-sm mb-1">Nombre *</label>
            <input id="customer-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro mb-3" placeholder="Nombre del cliente" />
            <label htmlFor="customer-phone" className="block text-dorado-oscuro text-sm mb-1">Teléfono</label>
            <input id="customer-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro mb-3" placeholder="Opcional" />
            <label htmlFor="customer-notes" className="block text-dorado-oscuro text-sm mb-1">Notas</label>
            <textarea id="customer-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro mb-4 resize-none" rows={2} placeholder="Opcional" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !form.name.trim()}
                className="flex-1 bg-dorado hover:bg-dorado-oscuro disabled:opacity-50 text-negro font-bold py-2 rounded">
                <FaPlus className="inline mr-1" /> {editingId ? 'Guardar' : 'Crear'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm}
                  className="bg-surface-3 hover:bg-ink/10 text-dorado-claro px-4 py-2 rounded border border-dorado-oscuro/40">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Buscador */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado-oscuro" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nombre o teléfono..."
              className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded-lg pl-10 pr-4 py-2.5 text-dorado-claro placeholder:text-dorado-oscuro" />
          </div>

          {/* Lista de clientes */}
          <div className="panel max-h-[24rem] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-dorado-oscuro text-center py-6 font-inter text-sm">
                <FaUsers className="inline mr-2" /> No hay clientes registrados
              </p>
            ) : (
              <div className="divide-y divide-dorado-oscuro/20">
                {filtered.map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)}
                    className={`p-3 cursor-pointer hover:bg-surface-3 ${selectedId === c.id ? 'bg-surface-3' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div className="font-inter text-dorado-claro font-medium">{c.name}</div>
                      <div className={`font-inter font-semibold ${Number(c.balance) > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        ${Number(c.balance || 0).toLocaleString()}
                      </div>
                    </div>
                    {c.phone && <div className="text-dorado-oscuro text-xs font-inter">{c.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalle del cliente seleccionado */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-cormorant text-dorado">{selected.name}</h3>
                  {selected.phone && <p className="text-dorado-oscuro text-sm font-inter">{selected.phone}</p>}
                  {selected.notes && <p className="text-dorado-oscuro text-xs font-inter mt-1">🗒️ {selected.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(selected)}
                    className="bg-surface-3 hover:bg-ink/10 text-dorado-claro px-3 py-1.5 rounded text-sm border border-dorado-oscuro/40">
                    ✏️ Editar
                  </button>
                  <button onClick={() => handleDelete(selected)}
                    className="bg-surface-3 hover:bg-rose-500/10 text-rose-300 px-3 py-1.5 rounded text-sm border border-rose-500/40">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-4 py-3">
                  <div className="text-dorado-oscuro text-xs font-inter">Saldo actual</div>
                  <div className={`font-inter font-bold text-2xl ${Number(selected.balance) > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    ${Number(selected.balance || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-surface-3 rounded border border-dorado-oscuro/20 px-4 py-3">
                  <div className="text-dorado-oscuro text-xs font-inter">Estado</div>
                  <div className={`font-inter font-bold text-2xl ${Number(selected.balance) > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {Number(selected.balance) > 0 ? 'Debe' : 'Al día'}
                  </div>
                </div>
              </div>

              {/* Registrar movimiento */}
              <form onSubmit={handlePay} className="bg-surface-3 rounded-lg border border-dorado-oscuro/30 p-4 mb-6">
                <h4 className="font-cormorant text-dorado-claro font-bold mb-3">
                  <FaHandHoldingUsd className="inline mr-2" />Registrar movimiento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="credit-type" className="block text-dorado-oscuro text-xs mb-1">Tipo</label>
                    <select id="credit-type" value={payType} onChange={(e) => setPayType(e.target.value)}
                      className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm">
                      <option value="abono">Abono</option>
                      <option value="cobro">Cobro total</option>
                    </select>
                  </div>
                  {payType === 'abono' && (
                    <div>
                      <label htmlFor="credit-amount" className="block text-dorado-oscuro text-xs mb-1">Monto *</label>
                      <input id="credit-amount" type="number" min="0" step="100" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm font-inter" placeholder="0" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="credit-notes" className="block text-dorado-oscuro text-xs mb-1">Notas del movimiento</label>
                    <input id="credit-notes" type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm" placeholder="Opcional" />
                  </div>
                </div>
                <button type="submit" disabled={saving || (payType === 'abono' && !payAmount)}
                  className="mt-3 bg-dorado hover:bg-dorado-oscuro disabled:opacity-50 text-negro font-bold px-4 py-2 rounded text-sm">
                  {saving ? 'Guardando...' : payType === 'cobro' ? 'Cobrar todo' : 'Registrar abono'}
                </button>
              </form>

              {/* Historial */}
              <h4 className="font-cormorant text-dorado-claro font-bold mb-3">
                <FaHistory className="inline mr-2" />Historial de movimientos
              </h4>
              {selectedTx.length === 0 ? (
                <p className="text-dorado-oscuro text-sm font-inter text-center py-4">Sin movimientos registrados</p>
              ) : (
                <div role="list" aria-label="Movimientos del cliente" className="divide-y divide-dorado-oscuro/20 max-h-[16rem] overflow-y-auto">
                  {selectedTx.map((t) => (
                    <div key={t.id} role="listitem" className="px-2 py-2 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <span className={`font-inter text-sm font-semibold ${
                          t.type === 'fiado' ? 'text-rose-300' : 'text-emerald-300'
                        }`}>
                          {CREDIT_TX_LABELS[t.type] || t.type}
                        </span>
                        <span className="text-dorado-oscuro text-xs ml-2 font-inter">
                          {timestampMs(t.createdAt)
                            ? new Date(timestampMs(t.createdAt)).toLocaleDateString('es-CO')
                            : '—'}
                        </span>
                        {t.notes && <span className="text-dorado-oscuro text-xs ml-2">· {t.notes}</span>}
                      </div>
                      <span className={`font-inter font-semibold ${
                        t.type === 'fiado' ? 'text-rose-300' : 'text-emerald-300'
                      }`}>
                        {t.type === 'fiado' ? '+' : '−'}${Number(t.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <FaUsers className="mx-auto text-dorado-oscuro text-4xl mb-3" />
              <p className="text-dorado-oscuro font-inter">Selecciona un cliente para ver su detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomersManager;
