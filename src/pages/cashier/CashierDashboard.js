import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useOrders';

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

    const result = await processPayment(orderId, method);
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

  return (
    <div className="min-h-screen bg-negro">
      {/* Header */}
      <header className="bg-gray-900 border-b border-dorado-oscuro/30 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="font-cormorant text-2xl font-bold text-dorado-claro">
              Panel del Cajero
            </h1>
            <p className="text-dorado-oscuro text-sm">
              Bienvenido, {currentUser?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-rojo hover:bg-rojo-oscuro text-white px-4 py-2 rounded"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-gray-800 border-b border-dorado-oscuro/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            {hasPermission('view_dashboard') && (
              <button
                onClick={() => navigate('/admin')}
                className="py-3 px-4 font-medium text-dorado-oscuro hover:text-dorado"
              >
                ← Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'orders'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos para Cobrar ({readyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'history'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Historial
            </button>
            <button
              onClick={() => setActiveTab('close')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'close'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Cuadre de Caja
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos para Cobrar</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce">🏮</div>
                <p className="text-dorado">Cargando pedidos...</p>
              </div>
            ) : readyOrders.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No hay pedidos pendientes de pago
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-dorado-oscuro text-sm">
                          Mesa {order.tableNumber || 'N/A'}
                        </p>
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
                      <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-600/30 rounded">
                        <div className="text-yellow-400 text-xs font-bold mb-1">📝 Notas:</div>
                        <div className="text-yellow-200 text-sm">{order.notes}</div>
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
                        className="w-full bg-negro border border-dorado-oscuro rounded px-4 py-3 text-dorado-claro mb-4"
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
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No hay ventas registradas hoy
                </p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg border border-dorado-oscuro/20">
                <div className="divide-y divide-dorado-oscuro/20">
                  {paidOrders.map((order) => (
                    <div key={order.id} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-dorado-claro font-bold">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-2">
                          Mesa {order.tableNumber || 'N/A'}
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
            <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
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
