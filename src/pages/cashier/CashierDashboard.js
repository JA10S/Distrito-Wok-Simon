import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useOrders';
import DashboardHeader from '../../components/layout/DashboardHeader';
import SummaryStats from '../../components/common/SummaryStats';
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
  timestampMs
} from '../../utils/orderUtils';

function CashierDashboard() {
  const { currentUser, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  
  const { orders: readyOrders, loading, processPayment } = useOrders('ready');
  const { orders: paidOrders } = useOrders('paid');
  
  const [paymentMethods, setPaymentMethods] = useState({});

  const handlePayment = async (orderId) => {
    const method = paymentMethods[orderId];
    if (!method) {
      alert('Seleccione un método de pago');
      return;
    }

    const result = await processPayment(orderId, method, currentUser);
    if (result.success) {
      alert('Pago procesado exitosamente');
      setPaymentMethods({ ...paymentMethods, [orderId]: '' });
    } else {
      alert('Error al procesar pago: ' + result.error);
    }
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      cash: 'Efectivo',
      bold: 'Bold (Nequi/Tarjeta)',
      nequi: 'Nequi Directo',
      card: 'Tarjeta Crédito/Débito'
    };
    return methods[method] || method;
  };

  const todaySales = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const cashSales = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.total || 0), 0);
  const boldSales = paidOrders.filter(o => o.paymentMethod === 'bold' || o.paymentMethod === 'nequi').reduce((sum, o) => sum + (o.total || 0), 0);
  const cardSales = paidOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + (o.total || 0), 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const paidToday = paidOrders.filter(
    (o) => (timestampMs(o.createdAt) || 0) >= startOfDay.getTime()
  );
  const collectedToday = paidToday.reduce((sum, o) => sum + (o.total || 0), 0);

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
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce">🏮</div>
                <p className="text-dorado">Cargando pedidos...</p>
              </div>
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
                        <span>IVA (10%):</span>
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
                      </select>

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
                  {paidOrders.map((order) => (
                    <div key={order.id} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-dorado-claro font-bold">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-2">
                          {getOrderLabel(order)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-dorado font-bold">
                          ${(order.total || 0).toLocaleString()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-2">
                          {getPaymentMethodName(order.paymentMethod)}
                        </span>
                      </div>
                    </div>
                  ))}
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
                      <span>Bold/Nequi:</span>
                      <span>${boldSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Tarjeta:</span>
                      <span>${cardSales.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-dorado font-semibold mb-4">Pedidos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-dorado-claro">
                      <span>Total Pedidos:</span>
                      <span>{paidOrders.length}</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Promedio por Pedido:</span>
                      <span>
                        ${paidOrders.length > 0 
                          ? Math.round(todaySales / paidOrders.length).toLocaleString() 
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded">
                Cerrar Caja
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CashierDashboard;
