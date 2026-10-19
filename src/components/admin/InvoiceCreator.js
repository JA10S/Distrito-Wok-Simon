import React, { useState, useEffect, useRef } from 'react';
import { useMenu } from '../../hooks/useMenu';
import LoadingScreen from '../common/LoadingScreen';
import OrderDetail from '../common/OrderDetail';
import {
  ADMIN_PAYMENT_METHODS,
  formatPaymentDetail,
  parsePriceOptions,
  resolveItemVariant,
  timestampMs,
  getOrderLabel,
  ORDER_TYPE_LABELS
} from '../../utils/orderUtils';
import { toCsv, downloadTextFile } from '../../utils/exportUtils';
import { FaSearch, FaFileInvoiceDollar, FaPlus, FaFileCsv, FaBan } from 'react-icons/fa';

const CATEGORIES = [
  { id: 'arroces', name: 'Arroces', icon: '🍚' },
  { id: 'corrientes', name: 'Corrientes', icon: '🍖' },
  { id: 'porciones', name: 'Porciones', icon: '🍽️' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' }
];

const normalizeText = (text) =>
  String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Registro rápido de facturas desde el panel de administración.
 * Se guardan directamente como pagadas (sin cocina/domicilio) y con el
 * precio del menú como precio final (el IVA ya viene incluido).
 */
function InvoiceCreator({ tables = [], invoices = [], onCreateInvoice, onUpdateInvoice, onCancelInvoice = null, user = null }) {
  const { menu, loading } = useMenu();
  const [activeCategory, setActiveCategory] = useState('arroces');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitCash, setSplitCash] = useState('');
  const [tableRef, setTableRef] = useState('');
  const [search, setSearch] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editMethod, setEditMethod] = useState('cash');
  const [editSplitCash, setEditSplitCash] = useState('');
  const [notice, setNotice] = useState(null);
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [page, setPage] = useState(1);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const itemsRef = useRef(invoiceItems);
  itemsRef.current = invoiceItems;

  useEffect(() => {
    if (!notice || notice.type !== 'success') return undefined;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setPage(1);
  }, [filterFrom, filterTo, filterMethod, filterQuery, includeCancelled]);

  const addItem = (item, variant = null) => {
    const resolved = resolveItemVariant(item, variant);
    const existing = invoiceItems.find(i => i.id === resolved.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i =>
        i.id === resolved.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setInvoiceItems([...invoiceItems, { ...resolved, quantity: 1 }]);
    }
  };

  const removeItem = (itemId) => {
    const existing = invoiceItems.find(i => i.id === itemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      setInvoiceItems(invoiceItems.map(i =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    } else {
      setInvoiceItems(invoiceItems.filter(i => i.id !== itemId));
    }
  };

  // Precio final = suma de los items (IVA ya incluido en los precios del menú)
  const total = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);

  // Pago mixto: una parte en efectivo y la otra en transferencia
  const buildSplit = (method, cashValue, baseTotal) => {
    if (method !== 'mixed') return { split: null, error: null };
    const cash = Number(cashValue);
    if (!Number.isFinite(cash) || cash <= 0) {
      return { split: null, error: 'Ingrese la parte pagada en efectivo' };
    }
    const transfer = baseTotal - cash;
    if (transfer <= 0) {
      return { split: null, error: 'La parte en transferencia debe ser mayor a 0' };
    }
    return { split: { cash, transfer }, error: null };
  };

  const query = search.trim();
  const searchResults = query
    ? CATEGORIES.flatMap(cat => menu[cat.id] || []).filter(item =>
        item.available !== false &&
        (normalizeText(item.name).includes(normalizeText(query)) ||
          normalizeText(item.description).includes(normalizeText(query)))
      )
    : [];

  const visibleItems = query
    ? searchResults
    : (menu[activeCategory] || []).filter(item => item.available !== false);

  const handleRegister = async () => {
    if (invoiceItems.length === 0) {
      alert('Agregue al menos un producto');
      return;
    }
    if (!paymentMethod) {
      alert('Seleccione un método de pago');
      return;
    }

    const tableNumber = tableRef ? parseInt(tableRef, 10) : 0;
    const { split, error } = buildSplit(paymentMethod, splitCash, total);
    if (error) {
      alert(error);
      return;
    }

    const payload = {
      items: invoiceItems,
      notes: notes.trim(),
      subtotal: total,
      total,
      type: tableNumber > 0 ? 'table' : 'pickup',
      tableId: null,
      tableNumber: tableNumber > 0 ? tableNumber : 0,
      paymentMethod,
      ...(split ? { paymentSplit: split } : {})
    };

    const backup = {
      items: invoiceItems,
      notes,
      tableRef,
      paymentMethod,
      splitCash
    };

    setInvoiceItems([]);
    setNotes('');
    setTableRef('');
    setSearch('');
    setPaymentMethod('cash');
    setSplitCash('');
    setNotice({ type: 'success', text: '✓ Factura registrada' });

    const result = await onCreateInvoice(payload, user);
    if (!result.success) {
      if (itemsRef.current.length === 0) {
        setInvoiceItems(backup.items);
        setNotes(backup.notes);
        setTableRef(backup.tableRef);
        setPaymentMethod(backup.paymentMethod);
        setSplitCash(backup.splitCash);
      }
      setNotice({ type: 'error', text: 'No se pudo registrar la factura: ' + result.error });
    }
  };

  const startEditPayment = (order) => {
    closeCancel();
    setEditingId(order.id);
    setEditMethod(order.paymentMethod || 'cash');
    setEditSplitCash(order.paymentSplit ? String(order.paymentSplit.cash || '') : '');
  };

  const cancelEditPayment = () => {
    setEditingId(null);
    setEditMethod('cash');
    setEditSplitCash('');
  };

  const saveEditPayment = async (order) => {
    const { split, error } = buildSplit(editMethod, editSplitCash, Number(order.total || 0));
    if (error) {
      alert(error);
      return;
    }
    setSavingEdit(true);
    const result = await onUpdateInvoice(order.id, {
      paymentMethod: editMethod,
      paymentSplit: split
    });
    setSavingEdit(false);

    if (!result.success) {
      setNotice({ type: 'error', text: 'No se pudo actualizar el pago: ' + result.error });
      return;
    }
    cancelEditPayment();
    setNotice({ type: 'success', text: '✓ Pago actualizado' });
  };

  const listNow = Date.now();
  const dayKeyOf = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filteredInvoices = (invoices || [])
    .filter(o => o.source === 'admin')
    .filter(o => (includeCancelled ? true : o.status !== 'cancelled'))
    .filter(o => filterMethod === 'all' || (o.paymentMethod || 'cash') === filterMethod)
    .filter(o => {
      if (!filterFrom && !filterTo) return true;
      const ms = timestampMs(o.createdAt);
      if (!ms) return false;
      const key = dayKeyOf(ms);
      if (filterFrom && key < filterFrom) return false;
      if (filterTo && key > filterTo) return false;
      return true;
    })
    .filter(o => {
      const q = normalizeText(filterQuery.trim());
      if (!q) return true;
      return normalizeText(getOrderLabel(o)).includes(q) || normalizeText(o.notes || '').includes(q);
    })
    .sort((a, b) => (timestampMs(b.createdAt) || listNow) - (timestampMs(a.createdAt) || listNow));

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageInvoices = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const filtersActive = !!(filterFrom || filterTo || filterMethod !== 'all' || filterQuery.trim() || includeCancelled);

  const resetFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterMethod('all');
    setFilterQuery('');
    setIncludeCancelled(false);
  };

  const openCancel = (order) => {
    setEditingId(null);
    setCancelTargetId(order.id);
    setCancelReason('');
  };

  const closeCancel = () => {
    setCancelTargetId(null);
    setCancelReason('');
  };

  const saveCancel = async (order) => {
    if (!onCancelInvoice) return;
    setCancelling(true);
    const result = await onCancelInvoice(order.id, { reason: cancelReason, user });
    setCancelling(false);
    if (!result.success) {
      setNotice({ type: 'error', text: 'No se pudo anular: ' + result.error });
      return;
    }
    closeCancel();
    setNotice({ type: 'success', text: '✓ Factura anulada' });
  };

  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) {
      alert('No hay facturas para exportar con los filtros actuales');
      return;
    }
    const headers = [
      'Número', 'Fecha', 'Hora', 'Tipo', 'Mesa', 'Productos',
      'Método de pago', 'Total', 'Estado', 'Anulada por', 'Motivo'
    ];
    const rows = filteredInvoices.map(o => {
      const ms = timestampMs(o.createdAt);
      const d = ms ? new Date(ms) : null;
      const productCount = (o.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      return [
        o.id,
        d ? d.toLocaleDateString('es-CO') : '',
        d ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
        ORDER_TYPE_LABELS[o.type] || o.type || '',
        o.tableNumber || '',
        productCount,
        formatPaymentDetail(o.paymentMethod, o.paymentSplit),
        Number(o.total || 0),
        o.status === 'cancelled' ? 'Anulada' : 'Pagada',
        o.cancelledByName || '',
        o.cancelledReason || ''
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`facturas-distrito-wok-${stamp}.csv`, toCsv(headers, rows));
    setNotice({ type: 'success', text: `✓ ${filteredInvoices.length} factura(s) exportadas a CSV` });
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Cargando menú..." />;
  }

  return (
    <div>
      <h2 className="text-xl font-cormorant text-dorado mb-6">Facturas (Ventas Directas)</h2>
      <p className="text-dorado-oscuro font-inter text-sm mb-6">
        Registra una venta que se guarda directamente como pagada: no pasa por cocina ni domicilio
        y no ocupa mesas. El precio del menú ya incluye IVA.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado-oscuro" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded-lg pl-10 pr-4 py-2.5 text-dorado-claro placeholder:text-dorado-oscuro focus:outline-none focus:border-dorado/60"
            />
          </div>

          {!query && (
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-dorado text-negro'
                      : 'bg-surface-2 text-dorado-claro border border-dorado-oscuro/30 hover:border-dorado/50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}

          <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20">
            <div className="divide-y divide-dorado-oscuro/20 max-h-[28rem] overflow-y-auto">
              {query && (
                <div className="px-4 py-2 text-dorado-oscuro text-sm border-b border-dorado-oscuro/20">
                  {searchResults.length} resultado{searchResults.length === 1 ? '' : 's'} para “{query}”
                </div>
              )}
              {visibleItems.map(item => {
                const sizeOptions = parsePriceOptions(item.price);
                return (
                  <div key={item.id} className="p-4 flex justify-between items-center gap-3">
                    <div className="flex-1">
                      <div className="text-dorado-claro font-medium">{item.name}</div>
                      <div className="text-dorado font-bold mt-1">
                        {sizeOptions
                          ? `$${sizeOptions[0].price.toLocaleString()} / $${sizeOptions[1].price.toLocaleString()}`
                          : item.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sizeOptions ? (
                        sizeOptions.map(opt => (
                          <button
                            key={opt.size}
                            onClick={() => addItem(item, opt)}
                            className="bg-surface-3 hover:bg-dorado hover:text-negro border border-dorado/50 text-dorado-claro font-bold py-2 px-3 rounded text-sm leading-tight transition"
                            aria-label={`${opt.label} ${item.name}`}
                          >
                            {opt.label}
                            <span className="block text-xs font-normal opacity-80">
                              ${opt.price.toLocaleString()}
                            </span>
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => addItem(item)}
                          className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
                          aria-label={`Agregar ${item.name}`}
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {query && searchResults.length === 0 && (
                <div className="p-6 text-center text-dorado-oscuro">
                  No se encontraron productos para “{query}”
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de la factura */}
        <div className="lg:col-span-1">
          <div className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 sticky top-4">
            <h3 className="font-cormorant text-xl font-bold text-dorado-claro mb-4">
              Nueva Factura
            </h3>

            {notice && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-inter flex items-center justify-between gap-2 ${
                  notice.type === 'error'
                    ? 'bg-red-500/10 border-red-500/40 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span>{notice.text}</span>
                <button
                  onClick={() => setNotice(null)}
                  aria-label="Cerrar aviso"
                  className="opacity-70 hover:opacity-100 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {invoiceItems.length === 0 ? (
              <p className="text-dorado-oscuro text-sm text-center py-6">
                Agregue productos para facturar
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {invoiceItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center gap-2">
                    <div className="flex-1">
                      <div className="text-dorado-claro text-sm">{item.name}</div>
                      <div className="text-dorado-oscuro text-xs font-inter">
                        {item.quantity} × ${item.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-surface-3 hover:bg-ink/10 text-dorado-claro w-7 h-7 rounded font-bold"
                        aria-label={`Quitar ${item.name}`}
                      >
                        −
                      </button>
                      <span className="text-dorado-claro font-inter text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, size: item.size })}
                        className="bg-dorado hover:bg-dorado-oscuro text-negro w-7 h-7 rounded font-bold"
                        aria-label={`Sumar ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-dorado-oscuro/20 pt-3 space-y-2">
              <div className="flex justify-between text-dorado-oscuro text-sm font-inter">
                <span>Productos:</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex justify-between text-dorado-claro font-semibold font-inter">
                <span>IVA (incluido):</span>
                <span>$0</span>
              </div>
              <div className="flex justify-between text-dorado font-bold text-lg font-inter">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">Método de pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro focus:outline-none focus:border-dorado/60"
                >
                  {ADMIN_PAYMENT_METHODS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {paymentMethod === 'mixed' && (
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
                      ${Math.max(total - (Number(splitCash) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">
                  Mesa (opcional, solo referencia)
                </label>
                <select
                  value={tableRef}
                  onChange={(e) => setTableRef(e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-dorado-claro focus:outline-none focus:border-dorado/60"
                >
                  <option value="">Sin mesa</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.number}>Mesa {t.number}</option>
                  ))}
                </select>
              </div>

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
                onClick={handleRegister}
                disabled={invoiceItems.length === 0}
                className="w-full bg-dorado hover:bg-dorado-oscuro disabled:opacity-50 disabled:cursor-not-allowed text-negro font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FaFileInvoiceDollar />
                Registrar Factura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de facturas */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 mb-4">
        <h3 className="text-lg font-cormorant text-dorado">Historial de Facturas</h3>
        <button
          onClick={handleExportCsv}
          className="bg-surface-2 hover:bg-surface-3 border border-dorado-oscuro/40 text-dorado-claro px-4 py-2 rounded-lg text-sm font-inter flex items-center gap-2 transition"
        >
          <FaFileCsv /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20 p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="inv-filter-from" className="block text-dorado-oscuro text-xs mb-1">Desde</label>
          <input
            id="inv-filter-from"
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-1.5 text-dorado-claro font-inter text-sm focus:outline-none focus:border-dorado/60"
          />
        </div>
        <div>
          <label htmlFor="inv-filter-to" className="block text-dorado-oscuro text-xs mb-1">Hasta</label>
          <input
            id="inv-filter-to"
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-1.5 text-dorado-claro font-inter text-sm focus:outline-none focus:border-dorado/60"
          />
        </div>
        <div>
          <label htmlFor="inv-filter-method" className="block text-dorado-oscuro text-xs mb-1">Método</label>
          <select
            id="inv-filter-method"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-1.5 text-dorado-claro font-inter text-sm focus:outline-none focus:border-dorado/60"
          >
            <option value="all">Todos</option>
            {ADMIN_PAYMENT_METHODS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="inv-filter-query" className="block text-dorado-oscuro text-xs mb-1">Buscar</label>
          <input
            id="inv-filter-query"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Mesa, tipo o nota..."
            className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-1.5 text-dorado-claro placeholder:text-dorado-oscuro font-inter text-sm focus:outline-none focus:border-dorado/60"
          />
        </div>
        <label className="flex items-center gap-2 text-dorado-claro text-sm font-inter pb-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => setIncludeCancelled(e.target.checked)}
            className="accent-dorado bg-surface-3"
          />
          Incluir anuladas
        </label>
        {filtersActive && (
          <button
            onClick={resetFilters}
            className="bg-surface-3 hover:bg-ink/10 border border-dorado-oscuro/40 text-dorado-claro px-3 py-1.5 rounded-lg text-sm font-inter"
          >
            Limpiar
          </button>
        )}
        <span className="text-dorado-oscuro text-sm font-inter pb-1.5 ml-auto">
          {filteredInvoices.length} factura{filteredInvoices.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 overflow-hidden">
        {pageInvoices.length === 0 ? (
          <p className="text-dorado-oscuro text-center py-6 font-inter">
            <FaPlus className="inline mr-2" />
            {filtersActive
              ? 'No hay facturas que coincidan con los filtros'
              : 'No hay facturas registradas todavía'}
          </p>
        ) : (
          <div className="divide-y divide-dorado-oscuro/20">
            {pageInvoices.map((order) => {
              const detailOpen = !!expandedInvoices[order.id];
              return editingId === order.id ? (
              <div key={order.id} className="px-5 py-4 bg-surface-3/40">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0">
                    <div className="text-dorado-claro font-medium">
                      {getOrderLabel(order)} · ${Number(order.total || 0).toLocaleString()}
                    </div>
                    <div className="text-dorado-oscuro text-xs font-inter">Método de pago</div>
                  </div>
                  <div className="flex flex-wrap items-end gap-3 flex-1">
                    <select
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value)}
                      className="bg-surface-2 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro text-sm focus:outline-none focus:border-dorado/60"
                      aria-label={`Método de pago de ${getOrderLabel(order)}`}
                    >
                      {ADMIN_PAYMENT_METHODS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>

                    {editMethod === 'mixed' && (
                      <div className="flex items-end gap-2">
                        <label className="text-dorado-oscuro text-xs">
                          Efectivo *
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={editSplitCash}
                            onChange={(e) => setEditSplitCash(e.target.value)}
                            placeholder="0"
                            className="block mt-1 w-32 bg-surface-2 border border-dorado-oscuro/40 rounded px-2 py-2 text-dorado-claro font-inter text-sm focus:outline-none focus:border-dorado/60"
                          />
                        </label>
                        <div className="text-dorado-oscuro text-xs pb-2">
                          Transferencia:{' '}
                          <span className="text-dorado">
                            ${Math.max(Number(order.total || 0) - (Number(editSplitCash) || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => saveEditPayment(order)}
                      disabled={savingEdit}
                      className="bg-dorado hover:bg-dorado-oscuro disabled:opacity-50 text-negro font-bold px-4 py-2 rounded text-sm"
                    >
                      {savingEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={cancelEditPayment}
                      className="bg-surface-3 hover:bg-ink/10 text-dorado-claro px-4 py-2 rounded text-sm border border-dorado-oscuro/40"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : cancelTargetId === order.id ? (
              <div key={order.id} className="px-5 py-4 bg-surface-3/40">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-dorado-claro font-medium">
                      Anular {getOrderLabel(order)} · ${Number(order.total || 0).toLocaleString()}
                    </div>
                    <label htmlFor={`cancel-reason-${order.id}`} className="text-dorado-oscuro text-xs font-inter">
                      Motivo de la anulación *
                    </label>
                    <textarea
                      id={`cancel-reason-${order.id}`}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      placeholder="Ej: Error de captura, cobro duplicado..."
                      className="block mt-1 w-full max-w-md bg-surface-2 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter text-sm focus:outline-none focus:border-dorado/60 resize-none"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => saveCancel(order)}
                      disabled={cancelling || !cancelReason.trim()}
                      className="bg-rojo hover:bg-rojo-oscuro disabled:opacity-50 text-dorado-claro font-bold px-4 py-2 rounded text-sm transition"
                    >
                      {cancelling ? 'Anulando...' : 'Confirmar anulación'}
                    </button>
                    <button
                      onClick={closeCancel}
                      className="bg-surface-3 hover:bg-ink/10 text-dorado-claro px-4 py-2 rounded text-sm border border-dorado-oscuro/40"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <React.Fragment key={order.id}>
                <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-3">
                  <div className="min-w-0">
                    <span className="font-inter text-dorado-claro font-semibold tracking-tight">
                      {getOrderLabel(order)}
                    </span>
                    <span className="text-dorado-oscuro text-sm ml-3 font-inter">
                      {order.items?.length || 0} producto{(order.items?.length || 0) === 1 ? '' : 's'} ·
                      {' '}{timestampMs(order.createdAt)
                        ? new Date(timestampMs(order.createdAt)).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                    {order.status === 'cancelled' && (
                      <span className="block text-rose-300/80 text-xs font-inter mt-1">
                        🚫 Anulada por {order.cancelledByName || '—'}: {order.cancelledReason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <span className="font-inter rounded-full bg-surface-3 border border-dorado-oscuro/40 text-dorado-claro px-3 py-1 text-xs">
                      {formatPaymentDetail(order.paymentMethod, order.paymentSplit)}
                    </span>
                    {order.status === 'cancelled' ? (
                      <span className="font-inter rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1 text-xs">
                        cancelled
                      </span>
                    ) : (
                      <span className="font-inter rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 text-xs">
                        paid
                      </span>
                    )}
                    <span className={`font-inter font-semibold ${order.status === 'cancelled' ? 'text-rose-300 line-through' : 'text-dorado'}`}>
                      ${Number(order.total || 0).toLocaleString()}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedInvoices((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
                      }
                      aria-expanded={detailOpen}
                      className="bg-surface-3 hover:bg-ink/10 border border-dorado-oscuro/40 text-dorado-claro px-3 py-1 rounded text-xs font-inter"
                    >
                      {detailOpen ? 'Ocultar detalle ▴' : 'Ver detalle ▾'}
                    </button>
                    {order.status !== 'cancelled' && (
                      <>
                    <button
                      onClick={() => startEditPayment(order)}
                      className="bg-surface-3 hover:bg-ink/10 border border-dorado-oscuro/40 text-dorado-claro px-3 py-1 rounded text-xs font-inter"
                      aria-label={`Editar pago de ${getOrderLabel(order)}`}
                    >
                      ✏️ Editar pago
                    </button>
                    {onCancelInvoice && (
                      <button
                        onClick={() => openCancel(order)}
                        className="bg-surface-3 hover:bg-rose-500/10 border border-rose-500/40 text-rose-300 px-3 py-1 rounded text-xs font-inter flex items-center gap-1"
                        aria-label={`Anular ${getOrderLabel(order)}`}
                      >
                        <FaBan /> Anular
                      </button>
                    )}
                      </>
                    )}
                  </div>
                </div>
                {detailOpen && (
                  <div className="px-5 pb-4">
                    <OrderDetail order={order} />
                  </div>
                )}
              </React.Fragment>
              );
            })}
          </div>
        )}
        {filteredInvoices.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-dorado-oscuro/20">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="bg-surface-3 hover:bg-ink/10 disabled:opacity-40 border border-dorado-oscuro/40 text-dorado-claro px-4 py-1.5 rounded text-sm font-inter"
            >
              ‹ Anterior
            </button>
            <span className="text-dorado-oscuro text-sm font-inter">
              Página {safePage} de {totalPages} · {filteredInvoices.length} factura{filteredInvoices.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="bg-surface-3 hover:bg-ink/10 disabled:opacity-40 border border-dorado-oscuro/40 text-dorado-claro px-4 py-1.5 rounded text-sm font-inter"
            >
              Siguiente ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceCreator;
