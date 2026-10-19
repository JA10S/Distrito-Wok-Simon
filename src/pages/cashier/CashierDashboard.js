import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useOrders';
import { useExpenses } from '../../hooks/useExpenses';
import { useCashClosing, closingTime } from '../../hooks/useCashClosing';
import { useCredit } from '../../hooks/useCredit';
import DashboardHeader from '../../components/layout/DashboardHeader';
import SummaryStats from '../../components/common/SummaryStats';
import LoadingScreen from '../../components/common/LoadingScreen';
import OrderDetail from '../../components/common/OrderDetail';
import {
  FaReceipt,
  FaHistory,
  FaCashRegister,
  FaMoneyBillWave,
  FaCheckCircle,
  FaInbox
} from 'react-icons/fa';
import {
  getOrderLabel,
  PAYMENT_METHOD_LABELS,
  computeDayTotals
} from '../../utils/orderUtils';

function CashierDashboard() {
  const { currentUser, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  
  const { orders: readyOrders, loading, processPayment } = useOrders('ready');
  const { customers, registerCredit } = useCredit();
  const [fiadoCustomers, setFiadoCustomers] = useState({});
  const { orders: paidOrders } = useOrders('paid');
  const { expenses } = useExpenses();
  const { closing, closeRegister } = useCashClosing();
  
  const [paymentMethods, setPaymentMethods] = useState({});
  const [mixedSplits, setMixedSplits] = useState({});
  const [expandedSales, setExpandedSales] = useState({});
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [savingClose, setSavingClose] = useState(false);

  // Al cargar un cierre existente, precarga el arqueo
  useEffect(() => {
    if (closing) {
      setCountedCash(String(closing.countedCash ?? ''));
      setCloseNotes(closing.notes || '');
    }
  }, [closing]);

  const handlePayment = async (orderId) => {
    const method = paymentMethods[orderId];
    if (!method) {
      alert('Seleccione un método de pago');
      return;
    }

    let split = null;
    if (method === 'mixed') {
      const order = readyOrders.find(o => o.id === orderId);
      const total = Number(order?.total || 0);
      const cash = Number(mixedSplits[orderId] || 0);
      if (!cash || cash <= 0) {
        alert('Ingrese la parte pagada en efectivo');
        return;
      }
      if (total - cash <= 0) {
        alert('La parte en transferencia debe ser mayor a 0');
        return;
      }
      split = { cash, transfer: total - cash };
    }

    if (method === 'fiado') {
      const customerId = fiadoCustomers[orderId];
      if (!customerId) {
        alert('Seleccione el cliente a quien fiarle');
        return;
      }
      const cust = customers.find((c) => c.id === customerId);
      const order = readyOrders.find((o) => o.id === orderId);
      const resultPay = await processPayment(orderId, method, currentUser, null);
      if (resultPay.success) {
        const credit = await registerCredit({
          customerId,
          type: 'fiado',
          amount: Number(order?.total || 0),
          orderId,
          notes: `Pedido fiado (${getPaymentMethodName(method)})`,
          user: currentUser
        });
        if (!credit.success) {
          alert('Pedido cobrado, pero no se pudo registrar el fiado: ' + credit.error);
        } else {
          alert(`Fiado registrado a ${cust?.name || 'cliente'} (saldo $${Number(credit.newBalance).toLocaleString()})`);
        }
        setPaymentMethods({ ...paymentMethods, [orderId]: '' });
        setFiadoCustomers({ ...fiadoCustomers, [orderId]: '' });
      } else {
        alert('Error al procesar pago: ' + resultPay.error);
      }
      return;
    }

    const result = await processPayment(orderId, method, currentUser, split);
    if (result.success) {
      alert('Pago procesado exitosamente');
      setPaymentMethods({ ...paymentMethods, [orderId]: '' });
      setMixedSplits({ ...mixedSplits, [orderId]: '' });
    } else {
      alert('Error al procesar pago: ' + result.error);
    }
  };

  const getPaymentMethodName = (method, split = null) => {
    if (method === 'mixed' && split) {
      return `Mixto: Efectivo $${Number(split.cash || 0).toLocaleString()} + Transferencia $${Number(split.transfer || 0).toLocaleString()}`;
    }
    const methods = {
      cash: 'Efectivo',
      bold: 'Bold (Nequi/Tarjeta)',
      nequi: 'Nequi Directo',
      card: 'Tarjeta Crédito/Débito',
      transfer: 'Transferencia',
      mixed: PAYMENT_METHOD_LABELS.mixed,
      fiado: 'Fiado'
    };
    return methods[method] || method;
  };

  // Totales SOLO del día (compartidos con el cierre manual del admin)
  const dayTotals = computeDayTotals(paidOrders, expenses, new Date());
  const paidToday = dayTotals.paidOrders;
  const todaySales = dayTotals.totalSales;
  const collectedToday = todaySales;
  const cashSales = dayTotals.cash;
  const transferSales = dayTotals.transfer;
  const boldSales = dayTotals.bold;
  const cardSales = dayTotals.card;
  const todayExpenses = dayTotals.dayExpenses;
  const expenseTotal = dayTotals.expenseTotal;
  const cashExpenseTotal = dayTotals.cashExpenseTotal;
  const cashExpected = dayTotals.cashExpected;
  const avgTicket = dayTotals.avgTicket;
  const closingSummary = {
    totalSales: todaySales,
    cash: cashSales,
    transfer: transferSales,
    bold: boldSales,
    card: cardSales,
    expenses: expenseTotal,
    cashExpenses: cashExpenseTotal,
    cashExpected,
    ordersCount: paidToday.length,
    avgTicket
  };

  const countedNum = countedCash === '' || countedCash === null || countedCash === undefined
    ? null
    : Number(countedCash);
  const difference = countedNum !== null && Number.isFinite(countedNum)
    ? countedNum - cashExpected
    : null;

  const handleCloseRegister = async () => {
    const value = countedNum;
    if (value === null || !Number.isFinite(value) || value < 0) {
      alert('Ingrese el efectivo contado en la gaveta');
      return;
    }
    const isUpdate = !!closing;
    const ok = window.confirm(
      isUpdate
        ? '¿Actualizar el cierre de caja de hoy con estos valores?'
        : `¿Cerrar caja? Efectivo contado: $${value.toLocaleString()} · Diferencia: $${(value - cashExpected).toLocaleString()}`
    );
    if (!ok) return;

    setSavingClose(true);
    const result = await closeRegister({
      summary: closingSummary,
      countedCash: value,
      notes: closeNotes,
      user: currentUser
    });
    setSavingClose(false);

    if (result.success) {
      alert(isUpdate ? 'Cierre de caja actualizado' : 'Caja cerrada exitosamente');
    } else {
      alert('Error al cerrar caja: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader
        title="Panel del Cajero"
        user={currentUser?.email}
        onLogout={logout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={hasPermission('view_dashboard') ? () => navigate('/admin') : null}
        tabs={[
          { id: 'orders', label: 'Pedidos para Cobrar', icon: <FaReceipt />, badge: readyOrders.length },
          { id: 'history', label: 'Historial', icon: <FaHistory /> },
          { id: 'close', label: 'Cuadre de Caja', icon: <FaCashRegister /> }
        ]}
      />

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Resúmenes (permiso view_summaries otorgado por el admin) */}
        {hasPermission('view_summaries') && (
          <SummaryStats
            stats={[
              { label: 'Por cobrar', value: readyOrders.length, icon: <FaReceipt />, iconColor: 'text-yellow-500', valueColor: 'text-yellow-500' },
              { label: 'Cobrado hoy', value: `$${collectedToday.toLocaleString('es-CO')}`, icon: <FaMoneyBillWave />, iconColor: 'text-green-500', valueColor: 'text-green-500' },
              { label: 'Pagados hoy', value: paidToday.length, icon: <FaCheckCircle />, iconColor: 'text-green-500', valueColor: 'text-green-500' },
              { label: 'Total pagados', value: paidOrders.length, icon: <FaHistory />, iconColor: 'text-dorado', valueColor: 'text-dorado' }
            ]}
          />
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos para Cobrar</h2>
            
            {loading ? (
              <LoadingScreen message="Cargando pedidos..." fullScreen={false} />
            ) : readyOrders.length === 0 ? (
              <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 text-center">
                <FaInbox className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
                <p className="text-dorado-oscuro">
                  No hay pedidos pendientes de pago
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 hover-lift"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-dorado-oscuro text-sm">
                          {getOrderLabel(order)}
                        </p>
                        {order.type && order.type !== 'table' && order.customer && (
                          <p className="text-dorado-oscuro text-xs">
                            {order.customer.phone}
                            {order.type === 'delivery' && order.customer.address && (
                              <> · 📍 {order.customer.address}</>
                            )}
                            {order.preferredPayment && (
                              <> · Pago: {PAYMENT_METHOD_LABELS[order.preferredPayment] || order.preferredPayment}</>
                            )}
                          </p>
                        )}
                      </div>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                        Listo para cobrar
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="flex justify-between text-dorado-claro">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Notas del pedido */}
                    {order.notes && (
                      <div className="notes-box mb-4 p-2 rounded">
                        <div className="notes-box-title text-xs font-bold mb-1">🗒️ Notas:</div>
                        <div className="notes-box-text text-sm">{order.notes}</div>
                      </div>
                    )}

                    <div className="border-t border-dorado-oscuro/30 pt-4">
                      <div className="flex justify-between text-dorado-claro mb-2">
                        <span>Subtotal:</span>
                        <span>${(order.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-dorado-claro mb-2">
                        <span>IVA (incluido):</span>
                        <span>${(order.tax || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-dorado font-bold text-xl">
                        <span>Total:</span>
                        <span>${(order.total || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-dorado-claro text-sm mb-2">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethods[order.id] || ''}
                        onChange={(e) => setPaymentMethods({ 
                          ...paymentMethods, 
                          [order.id]: e.target.value 
                        })}
                        className="w-full bg-surface-3 border border-dorado-oscuro rounded px-4 py-3 text-dorado-claro mb-4"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="cash">Efectivo</option>
                        <option value="bold">Bold (Nequi/Tarjeta)</option>
                        <option value="nequi">Nequi Directo</option>
                        <option value="card">Tarjeta Crédito/Débito</option>
                        <option value="mixed">Mixto (Efectivo + Transferencia)</option>
                        <option value="fiado">Fiado (deja saldo)</option>
                      </select>

                      {paymentMethods[order.id] === 'fiado' && (
                        <div className="bg-surface-3 border border-amber-400/40 rounded p-3 mb-4">
                          <label htmlFor={`fiado-customer-${order.id}`} className="block text-amber-300 text-sm mb-1">
                            Cliente a quien fiarle *
                          </label>
                          <select
                            id={`fiado-customer-${order.id}`}
                            value={fiadoCustomers[order.id] || ''}
                            onChange={(e) =>
                              setFiadoCustomers({ ...fiadoCustomers, [order.id]: e.target.value })
                            }
                            className="w-full bg-surface-2 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro font-inter text-sm focus:outline-none focus:border-dorado/60"
                          >
                            <option value="">Seleccionar cliente...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} · saldo ${Number(c.balance || 0).toLocaleString()}
                              </option>
                            ))}
                          </select>
                          <p className="text-amber-300/80 text-xs font-inter mt-2">
                            El total del pedido se suma al saldo del cliente en
                            <span className="font-semibold"> Admin → Cartera</span>.
                          </p>
                        </div>
                      )}

                      {paymentMethods[order.id] === 'mixed' && (
                        <div className="bg-surface-3 border border-dorado/40 rounded p-3 mb-4">
                          <label className="block text-dorado-claro text-sm mb-1">
                            Parte en efectivo *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={mixedSplits[order.id] ?? ''}
                            onChange={(e) =>
                              setMixedSplits({ ...mixedSplits, [order.id]: e.target.value })
                            }
                            placeholder="0"
                            className="w-full bg-surface-2 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter focus:outline-none focus:border-dorado/60"
                          />
                          <div className="flex justify-between text-dorado-oscuro text-xs font-inter mt-1">
                            <span>Transferencia:</span>
                            <span className="text-dorado">
                              ${Math.max(
                                Number(order.total || 0) - (Number(mixedSplits[order.id]) || 0),
                                0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handlePayment(order.id)}
                        className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded"
                      >
                        Procesar Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Historial de Ventas</h2>
            
            {paidOrders.length === 0 ? (
              <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 text-center">
                <FaHistory className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
                <p className="text-dorado-oscuro">
                  No hay ventas registradas hoy
                </p>
              </div>
            ) : (
              <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20">
                <div className="divide-y divide-dorado-oscuro/20">
                  {paidOrders.map((order) => {
                    const detailOpen = !!expandedSales[order.id];
                    return (
                      <div key={order.id} className="p-4">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                          <div>
                            <span className="text-dorado-claro font-bold">
                              Pedido #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-dorado-oscuro text-sm ml-2">
                              {getOrderLabel(order)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            <div className="text-right">
                              <span className="text-dorado font-bold">
                                ${(order.total || 0).toLocaleString()}
                              </span>
                              <span className="text-dorado-oscuro text-sm ml-2">
                                {getPaymentMethodName(order.paymentMethod, order.paymentSplit)}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedSales((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
                              }
                              aria-expanded={detailOpen}
                              className="bg-surface-3 hover:bg-ink/10 border border-dorado-oscuro/40 text-dorado-claro px-3 py-1 rounded text-xs font-inter"
                            >
                              {detailOpen ? 'Ocultar detalle ▴' : 'Ver detalle ▾'}
                            </button>
                          </div>
                        </div>
                        {detailOpen && <OrderDetail order={order} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'close' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Cuadre de Caja</h2>
            <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-dorado font-semibold mb-4">Resumen del Día</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-dorado-claro">
                      <span>Total Ventas:</span>
                      <span className="font-bold">${todaySales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Efectivo:</span>
                      <span>${cashSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Transferencia:</span>
                      <span>${transferSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Bold/Nequi:</span>
                      <span>${boldSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Tarjeta:</span>
                      <span>${cardSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Gastos Caja Menor:</span>
                      <span className="text-rose-300">−${expenseTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro border-t border-dorado-oscuro/20 pt-2">
                      <span>Efectivo Esperado:</span>
                      <span className="font-bold">${cashExpected.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-dorado font-semibold mb-4">Pedidos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-dorado-claro">
                      <span>Total Pedidos:</span>
                      <span>{paidToday.length}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Promedio por Pedido:</span>
                      <span>${avgTicket.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arqueo y cierre de caja */}
              <div className="mt-6 border-t border-dorado-oscuro/30 pt-6">
                <h3 className="text-dorado font-semibold mb-4">Arqueo de Cierre</h3>

                {closing && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
                    <p className="text-emerald-300 font-semibold font-inter">
                      ✅ Caja cerrada el {closing.date}
                      {closingTime(closing.closedAt) && ` a las ${closingTime(closing.closedAt)}`}
                      {closing.closedBy && ` por ${closing.closedBy}`}
                    </p>
                    <p className="text-emerald-300/80 text-sm font-inter mt-1">
                      Contado: ${Number(closing.countedCash || 0).toLocaleString()}
                      {' · '}Esperado: ${Number(closing.summary?.cashExpected || 0).toLocaleString()}
                      {' · '}Diferencia: ${Number(closing.difference || 0).toLocaleString()}
                    </p>
                    {closing.notes && (
                      <p className="text-dorado-claro text-sm mt-1">🗒️ {closing.notes}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="counted-cash" className="block text-dorado-claro text-sm mb-1">
                      Efectivo contado (físico en gaveta) *
                    </label>
                    <input
                      id="counted-cash"
                      type="number"
                      min="0"
                      step="100"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="0"
                      className="w-full bg-surface-3 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro font-inter focus:outline-none focus:border-dorado/60"
                    />
                  </div>
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
                </div>

                <div className="mt-4">
                  <label htmlFor="close-notes" className="block text-dorado-claro text-sm mb-1">
                    Notas del cierre (opcional)
                  </label>
                  <textarea
                    id="close-notes"
                    rows="2"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Observaciones: sobrante/faltante, incidencias..."
                    className="w-full bg-surface-3 border border-dorado-oscuro/40 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro text-sm focus:outline-none focus:border-dorado/60"
                  />
                </div>

                {/* Compras (caja menor) del día */}
                <div className="mt-4">
                  <h4 className="text-dorado-claro text-sm font-semibold mb-2">
                    Compras del día ({todayExpenses.length})
                  </h4>
                  {todayExpenses.length === 0 ? (
                    <p className="text-dorado-oscuro text-sm">
                      No hay compras registradas hoy
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {todayExpenses.map((e) => (
                        <li
                          key={e.id}
                          className="flex justify-between items-center gap-3 bg-surface-2 border border-dorado-oscuro/20 rounded px-3 py-1.5 text-sm"
                        >
                          <span className="text-dorado-claro truncate">{e.concept}</span>
                          <span className="text-rose-300 font-inter shrink-0">
                            −${Number(e.amount || 0).toLocaleString()}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between items-center gap-3 px-3 pt-1 text-sm border-t border-dorado-oscuro/30">
                        <span className="text-dorado font-semibold">Total compras</span>
                        <span className="text-rose-300 font-inter font-bold">
                          −${expenseTotal.toLocaleString()}
                        </span>
                      </li>
                    </ul>
                  )}
                </div>

                <button
                  onClick={handleCloseRegister}
                  disabled={savingClose}
                  className="w-full mt-4 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded disabled:opacity-50"
                >
                  {savingClose ? 'Guardando...' : closing ? 'Actualizar Cierre' : 'Cerrar Caja'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CashierDashboard;
