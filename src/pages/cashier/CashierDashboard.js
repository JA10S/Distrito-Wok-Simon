import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function CashierDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  // Datos de ejemplo para pedidos pendientes
  const pendingOrders = [
    {
      id: 1,
      table: 2,
      items: [
        { name: 'Arroz Costeño Wok', quantity: 2, price: 40000 },
        { name: 'Coca-Cola 600ML', quantity: 2, price: 4500 },
      ],
      subtotal: 89000,
      tax: 8900,
      total: 97900,
      status: 'ready',
    },
    {
      id: 2,
      table: 6,
      items: [
        { name: 'Arroz Currambero Wok', quantity: 1, price: 47000 },
        { name: 'Agua Brisa 600ML', quantity: 2, price: 2000 },
      ],
      subtotal: 51000,
      tax: 5100,
      total: 56100,
      status: 'ready',
    },
  ];

  const [paymentMethod, setPaymentMethod] = useState('');

  const handlePayment = (orderId) => {
    if (!paymentMethod) {
      alert('Seleccione un método de pago');
      return;
    }
    alert(`Pago procesado: Pedido #${orderId} - Método: ${paymentMethod}`);
    setPaymentMethod('');
  };

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
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'orders'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos para Cobrar
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
            
            {pendingOrders.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No hay pedidos pendientes de pago
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                          Pedido #{order.id}
                        </h3>
                        <p className="text-dorado-oscuro text-sm">
                          Mesa {order.table}
                        </p>
                      </div>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                        Listo para cobrar
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-dorado-claro">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dorado-oscuro/30 pt-4">
                      <div className="flex justify-between text-dorado-claro mb-2">
                        <span>Subtotal:</span>
                        <span>${order.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-dorado-claro mb-2">
                        <span>IVA (10%):</span>
                        <span>${order.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-dorado font-bold text-xl">
                        <span>Total:</span>
                        <span>${order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-dorado-claro text-sm mb-2">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
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
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                Historial de ventas del día
              </p>
            </div>
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
                      <span>$0</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Efectivo:</span>
                      <span>$0</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Bold/Nequi:</span>
                      <span>$0</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Tarjeta:</span>
                      <span>$0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-dorado font-semibold mb-4">Pedidos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-dorado-claro">
                      <span>Total Pedidos:</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between text-dorado-claro">
                      <span>Promedio por Pedido:</span>
                      <span>$0</span>
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